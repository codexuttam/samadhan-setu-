import type { NextFunction, Request, Response } from 'express';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { authenticator } from 'otplib';
import { config } from '../../config';
import { prisma } from '../../lib/prisma';
import { AppError, Errors } from '../../lib/errors';
import { decrypt, encrypt, hmac, randomToken, safeEqual, sha256, signPayload, verifyPayload } from '../../lib/crypto';
import { getSettings } from '../../lib/settings';
import { audit } from '../audit/audit.service';
import type { AuthUser } from './rbac';

/**
 * Authority authentication — completely separate from citizen OTP.
 * Argon2id passwords · opaque server-side sessions (hashed) · HttpOnly/Secure/SameSite=Strict cookie
 * · CSRF header check · login lockout · optional TOTP 2FA.
 */
export const SESSION_COOKIE = config.isProd ? '__Host-ss_auth' : 'ss_auth';
const ARGON_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
const DUMMY_HASH_P = argonHash('dummy-password-for-timing', ARGON_OPTS);
const INVALID_LOGIN = () => new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

export const hashPassword = (pw: string) => argonHash(pw, ARGON_OPTS);

export function passwordPolicy(pw: string) {
  if (pw.length < 12 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
    throw Errors.badRequest('Password must be at least 12 characters and include letters and numbers.');
  }
}

export const csrfFor = (sessionId: string) => hmac(config.SESSION_SECRET, `csrf:${sessionId}`);

function cookieOpts(maxAgeMs: number) {
  return { httpOnly: true, secure: config.isProd, sameSite: 'strict' as const, path: '/', maxAge: maxAgeMs };
}

async function createSession(userId: string, req: Request, res: Response) {
  const s = await getSettings();
  const raw = randomToken(32);
  const session = await prisma.authoritySession.create({
    data: {
      tokenHash: sha256(raw),
      csrfTokenHash: '',
      userId,
      expiresAt: new Date(Date.now() + s.auth.sessionAbsoluteHours * 3600_000),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 200),
    },
  });
  const csrf = csrfFor(session.id);
  await prisma.authoritySession.update({ where: { id: session.id }, data: { csrfTokenHash: sha256(csrf) } });
  res.cookie(SESSION_COOKIE, raw, cookieOpts(s.auth.sessionAbsoluteHours * 3600_000));
  await prisma.authorityUser.update({ where: { id: userId }, data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null } });
  return csrf;
}

export async function login(email: string, password: string, req: Request, res: Response) {
  const s = await getSettings();
  const user = await prisma.authorityUser.findUnique({ where: { email: email.toLowerCase().trim() }, include: { role: true } });
  if (!user || !user.passwordHash || user.status !== 'ACTIVE') {
    await argonVerify(await DUMMY_HASH_P, password).catch(() => false); // equalise timing
    throw INVALID_LOGIN();
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) throw INVALID_LOGIN();

  const ok = await argonVerify(user.passwordHash, password).catch(() => false);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    const lock = failed >= s.auth.maxFailedLogins;
    await prisma.authorityUser.update({
      where: { id: user.id },
      data: { failedLoginCount: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + s.auth.lockoutMinutes * 60_000) : undefined },
    });
    await audit({ actor: { type: 'AUTHORITY', id: user.id, role: user.role.code }, action: 'LOGIN_FAILED', ip: req.ip, metadata: { locked: lock } });
    throw INVALID_LOGIN();
  }

  if (user.totpEnabled) {
    const mfaToken = signPayload({ u: user.id, p: 'mfa', exp: Math.floor(Date.now() / 1000) + 300 }, config.SESSION_SECRET);
    return { mfaRequired: true as const, mfaToken };
  }
  const csrfToken = await createSession(user.id, req, res);
  await audit({ actor: { type: 'AUTHORITY', id: user.id, role: user.role.code }, action: 'LOGIN', ip: req.ip });
  return { mfaRequired: false as const, csrfToken };
}

export async function completeMfa(mfaToken: string, code: string, req: Request, res: Response) {
  const p = verifyPayload<{ u: string; p: string }>(mfaToken, config.SESSION_SECRET);
  if (!p || p.p !== 'mfa') throw new AppError(401, 'MFA_EXPIRED', 'Your sign-in session expired. Please sign in again.');
  const user = await prisma.authorityUser.findUnique({ where: { id: p.u }, include: { role: true } });
  if (!user?.totpSecretEnc || user.status !== 'ACTIVE') throw INVALID_LOGIN();
  if (!authenticator.check(code, decrypt(user.totpSecretEnc))) throw new AppError(401, 'MFA_INVALID', 'The authentication code is incorrect.');
  const csrfToken = await createSession(user.id, req, res);
  await audit({ actor: { type: 'AUTHORITY', id: user.id, role: user.role.code }, action: 'LOGIN', ip: req.ip, metadata: { mfa: true } });
  return { csrfToken };
}

export async function logout(req: Request, res: Response) {
  const raw = req.cookies?.[SESSION_COOKIE];
  if (raw) await prisma.authoritySession.updateMany({ where: { tokenHash: sha256(raw) }, data: { revokedAt: new Date() } });
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  if (req.authUser) await audit({ actor: { type: 'AUTHORITY', id: req.authUser.id, role: req.authUser.roleCode }, action: 'LOGOUT', ip: req.ip });
}

/** Loads the session → AuthUser. Rejects expired/idle/revoked sessions. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const raw = req.cookies?.[SESSION_COOKIE];
    if (!raw || typeof raw !== 'string') throw Errors.unauthorized();
    const s = await getSettings();
    const session = await prisma.authoritySession.findUnique({
      where: { tokenHash: sha256(raw) },
      include: { user: { include: { role: { include: { level: true, permissions: { include: { permission: true } } } } } } },
    });
    const now = Date.now();
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() < now ||
      now - session.lastSeenAt.getTime() > s.auth.sessionIdleMinutes * 60_000 ||
      session.user.status !== 'ACTIVE'
    ) {
      throw new AppError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
    }
    if (now - session.lastSeenAt.getTime() > 60_000) {
      await prisma.authoritySession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
    }
    const u = session.user;
    req.authUser = {
      id: u.id,
      name: u.name,
      email: u.email,
      roleCode: u.role.code,
      roleName: u.role.name,
      scope: u.role.scope,
      levelOrder: u.role.level.levelOrder,
      levelName: u.role.level.name,
      permissions: new Set(u.role.permissions.map((rp) => rp.permission.code)),
      departmentId: u.departmentId,
      zoneId: u.zoneId,
      wardId: u.wardId,
      sessionId: session.id,
      totpEnabled: u.totpEnabled,
    } satisfies AuthUser;
    next();
  } catch (e) {
    next(e);
  }
}

/** CSRF: mutating requests must echo the per-session token in X-CSRF-Token. */
export function csrfProtect(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const header = req.get('x-csrf-token');
  if (!req.authUser || !header || !safeEqual(header, csrfFor(req.authUser.sessionId))) {
    return next(new AppError(403, 'CSRF', 'Your session token is invalid. Please refresh the page.'));
  }
  next();
}

// ── Activation (admin-created accounts set their own password) ──
export async function createActivationToken(userId: string) {
  const raw = randomToken(32);
  await prisma.accountActivationToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  await prisma.accountActivationToken.create({ data: { userId, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + 48 * 3600_000) } });
  return `${config.APP_BASE_URL}/authority/activate/${raw}`;
}

export async function activateAccount(rawToken: string, password: string, ip?: string) {
  passwordPolicy(password);
  const t = await prisma.accountActivationToken.findUnique({ where: { tokenHash: sha256(rawToken) }, include: { user: { include: { role: true } } } });
  if (!t || t.usedAt || t.expiresAt < new Date() || t.user.status === 'SUSPENDED') throw Errors.linkInvalid();
  await prisma.$transaction([
    prisma.accountActivationToken.update({ where: { id: t.id }, data: { usedAt: new Date() } }),
    prisma.authorityUser.update({ where: { id: t.userId }, data: { passwordHash: await hashPassword(password), status: 'ACTIVE' } }),
  ]);
  await audit({ actor: { type: 'AUTHORITY', id: t.userId, role: t.user.role.code }, action: 'ACCOUNT_ACTIVATED', ip });
}

// ── TOTP enrolment ──
export async function beginTotp(user: AuthUser) {
  const secret = authenticator.generateSecret();
  await prisma.authorityUser.update({ where: { id: user.id }, data: { totpSecretEnc: encrypt(secret), totpEnabled: false } });
  return { secret, otpauthUrl: authenticator.keyuri(user.email, 'Samadhan Setu', secret) };
}

export async function confirmTotp(user: AuthUser, code: string) {
  const u = await prisma.authorityUser.findUniqueOrThrow({ where: { id: user.id } });
  if (!u.totpSecretEnc || !authenticator.check(code, decrypt(u.totpSecretEnc))) throw Errors.badRequest('The authentication code is incorrect.');
  await prisma.authorityUser.update({ where: { id: user.id }, data: { totpEnabled: true } });
  await audit({ actor: { type: 'AUTHORITY', id: user.id, role: user.roleCode }, action: 'MFA_ENABLED' });
}
