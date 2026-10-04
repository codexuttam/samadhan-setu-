import crypto from 'node:crypto';
import type { OtpPurpose } from '@prisma/client';
import { prisma, type Tx } from '../../lib/prisma';
import { generateOtp, hashOtp, ipHash, normalizePhone, phoneHash, safeEqual, signPayload, verifyPayload } from '../../lib/crypto';
import { AppError, Errors } from '../../lib/errors';
import { getSettings } from '../../lib/settings';
import { logger } from '../../lib/logger';
import { whatsapp } from '../whatsapp/provider';
import { issueAccessToken } from '../tracking/accessTokens';

/**
 * WhatsApp OTP — the only citizen authentication mechanism.
 *  - CSPRNG 6-digit codes, only an HMAC (peppered, bound to challenge id) is stored
 *  - 5 min expiry, 5 attempts per challenge
 *  - rate limits per phone and per IP (plus express-level per-IP/session limits)
 *  - tracking requests never reveal whether a ticket/phone pair exists (decoy challenges)
 */
const GENERIC_SENT = 'If the details are correct, a 6-digit code has been sent to your WhatsApp.';
const INVALID = () => new AppError(400, 'OTP_INVALID', 'The code is incorrect or has expired. Please try again or request a new code.');
const EXPIRED = () => new AppError(400, 'OTP_EXPIRED', 'This code has expired. Please request a new one.');

export function requirePhone(raw: string) {
  const e164 = normalizePhone(raw);
  if (!e164) throw Errors.badRequest('Please enter a valid 10-digit mobile number.');
  return e164;
}

async function enforceRateLimits(pHash: string, iHash: string | null) {
  const s = await getSettings();
  const since = new Date(Date.now() - 15 * 60_000);
  const [byPhone, byIp] = await Promise.all([
    prisma.otpChallenge.count({ where: { phoneHash: pHash, createdAt: { gte: since } } }),
    iHash ? prisma.otpChallenge.count({ where: { ipHash: iHash, createdAt: { gte: since } } }) : Promise.resolve(0),
  ]);
  if (byPhone >= s.otp.maxPerPhonePer15Min || byIp >= s.otp.maxPerIpPer15Min) {
    throw Errors.tooMany('Too many code requests. Please wait 15 minutes before trying again.');
  }
}

export async function requestOtp(input: { phone: string; purpose: OtpPurpose; ip?: string; publicReference?: string }) {
  const e164 = requirePhone(input.phone);
  const pHash = phoneHash(e164);
  const iHash = ipHash(input.ip);
  await enforceRateLimits(pHash, iHash);
  const s = await getSettings();

  let ticketId: string | null = null;
  let shouldSend = true;
  if (input.purpose === 'TRACK_TICKET') {
    const ticket = input.publicReference
      ? await prisma.ticket.findUnique({ where: { publicReference: input.publicReference.trim().toUpperCase() }, include: { contact: true } })
      : null;
    if (ticket?.contact && safeEqual(ticket.contact.phoneHash, pHash)) ticketId = ticket.id;
    else shouldSend = false; // decoy: identical response, no message
  }

  const id = crypto.randomUUID();
  const code = generateOtp();
  await prisma.otpChallenge.create({
    data: {
      id,
      purpose: input.purpose,
      phoneHash: pHash,
      codeHash: shouldSend ? hashOtp(id, code) : hashOtp(id, crypto.randomBytes(16).toString('hex')),
      maxAttempts: s.otp.maxAttempts,
      ticketId,
      ipHash: iHash,
      expiresAt: new Date(Date.now() + s.otp.ttlSeconds * 1000),
    },
  });

  if (shouldSend) {
    try {
      await whatsapp.sendTemplate({ to: e164, template: 'ss_otp', bodyParams: [], otpCode: code });
      await prisma.otpChallenge.update({ where: { id }, data: { delivered: true } });
    } catch (err) {
      logger.warn('OTP delivery failed', { purpose: input.purpose, err: err as Error });
      throw Errors.delivery();
    }
  }
  return { challengeId: id, expiresInSeconds: s.otp.ttlSeconds, message: GENERIC_SENT };
}

async function checkCode(challengeId: string, code: string, purpose: OtpPurpose) {
  if (!/^[0-9a-f-]{36}$/.test(challengeId) || !/^\d{6}$/.test(code)) throw INVALID();
  const ch = await prisma.otpChallenge.findUnique({ where: { id: challengeId } });
  if (!ch || ch.purpose !== purpose || ch.consumedAt || ch.verifiedAt) throw INVALID();
  if (ch.expiresAt < new Date()) throw EXPIRED();

  // Atomically consume one attempt
  const upd = await prisma.otpChallenge.updateMany({
    where: { id: ch.id, attempts: { lt: ch.maxAttempts }, verifiedAt: null },
    data: { attempts: { increment: 1 } },
  });
  if (upd.count === 0) throw Errors.tooMany('Too many incorrect attempts. Please request a new code.');

  const ok = safeEqual(hashOtp(ch.id, code), ch.codeHash) && (purpose !== 'TRACK_TICKET' || !!ch.ticketId);
  if (!ok) {
    if (ch.attempts + 1 >= ch.maxAttempts) throw Errors.tooMany('Too many incorrect attempts. Please request a new code.');
    throw INVALID();
  }
  await prisma.otpChallenge.update({ where: { id: ch.id }, data: { verifiedAt: new Date() } });
  return ch;
}

/** CREATE_TICKET: returns a short-lived verification token to attach to the complaint submission. */
export async function verifyCreateOtp(challengeId: string, code: string) {
  await checkCode(challengeId, code, 'CREATE_TICKET');
  return signPayload({ c: challengeId, p: 'C', exp: Math.floor(Date.now() / 1000) + 15 * 60 });
}

/** TRACK_TICKET: returns a signed tracking link token for the matched ticket. */
export async function verifyTrackOtp(challengeId: string, code: string) {
  const ch = await checkCode(challengeId, code, 'TRACK_TICKET');
  await prisma.otpChallenge.update({ where: { id: ch.id }, data: { consumedAt: new Date() } });
  return issueAccessToken(ch.ticketId!, 'TRACK');
}

/** Consumed inside the ticket-creation transaction (single use). */
export async function consumeCreateVerification(tx: Tx, token: string, e164: string) {
  const p = verifyPayload<{ c: string; p: string }>(token);
  if (!p || p.p !== 'C') throw new AppError(401, 'VERIFICATION_EXPIRED', 'Your phone verification has expired. Please verify again.');
  const ch = await tx.otpChallenge.findUnique({ where: { id: p.c } });
  if (!ch || !ch.verifiedAt || !safeEqual(ch.phoneHash, phoneHash(e164))) {
    throw new AppError(401, 'VERIFICATION_EXPIRED', 'Your phone verification has expired. Please verify again.');
  }
  const res = await tx.otpChallenge.updateMany({ where: { id: ch.id, consumedAt: null }, data: { consumedAt: new Date() } });
  if (res.count !== 1) throw new AppError(409, 'ALREADY_USED', 'This verification was already used. Please verify your number again.');
  return ch;
}
