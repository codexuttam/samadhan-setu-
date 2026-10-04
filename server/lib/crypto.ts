import crypto from 'node:crypto';
import { config } from '../config';

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(input: string | Buffer) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function hmac(key: string, input: string) {
  return crypto.createHmac('sha256', key).update(input).digest('hex');
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Cryptographically secure 6-digit OTP (uniform, no modulo bias). */
export function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(challengeId: string, code: string) {
  return hmac(config.OTP_PEPPER, `${challengeId}:${code}`);
}

/** Normalise an Indian mobile number to E.164. Returns null when invalid. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let national = digits;
  if (digits.length === 12 && digits.startsWith('91')) national = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) national = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(national)) return null;
  return `+91${national}`;
}

export function phoneHash(e164: string) {
  return hmac(config.PHONE_HASH_KEY, e164);
}

export function ipHash(ip?: string) {
  return ip ? hmac(config.PHONE_HASH_KEY, `ip:${ip}`) : null;
}

// AES-256-GCM for data at rest (citizen phone numbers, TOTP secrets)
const encKey = Buffer.from(config.DATA_ENCRYPTION_KEY, 'base64');
if (encKey.length !== 32) {
  console.error('DATA_ENCRYPTION_KEY must decode to exactly 32 bytes');
  process.exit(1);
}

export function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ct.toString('base64url')}`;
}

export function decrypt(payload: string) {
  const [v, iv, tag, ct] = payload.split('.');
  if (v !== 'v1') throw new Error('Unsupported ciphertext version');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8');
}

/** Compact signed token: base64url(json).base64url(hmac). */
export function signPayload(payload: object, secret = config.LINK_SIGNING_SECRET) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyPayload<T>(token: string, secret = config.LINK_SIGNING_SECRET): T | null {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof data.exp === 'number' && Date.now() / 1000 > data.exp) return null;
    return data as T;
  } catch {
    return null;
  }
}
