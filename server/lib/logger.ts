/**
 * Minimal structured logger with mandatory redaction.
 * Never logs: OTPs, passwords, tokens, cookies, full phone numbers.
 */
const SENSITIVE_KEYS = /(otp|code|password|passwd|secret|token|cookie|authorization|phone|session|csrf)/i;
const PHONE_RE = /(\+?\d[\d\s-]{6,}\d)/g;
const TOKEN_PATH_RE = /\/(secure|verify|review|activate|files)\/[^/?\s]+/gi;

export function maskPhone(e164?: string | null) {
  if (!e164) return '';
  const digits = e164.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  const cc = e164.startsWith('+91') ? '+91 ' : '+';
  return `${cc}******${last4}`;
}

export function redactString(s: string) {
  return s
    .replace(TOKEN_PATH_RE, '/$1/[redacted]')
    .replace(PHONE_RE, (m) => (m.replace(/\D/g, '').length >= 8 ? maskPhone(m) : m));
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[depth]';
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    if (value instanceof Error) return { name: value.name, message: redactString(value.message) };
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEYS.test(k) ? '[redacted]' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function write(level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) {
  const line = { ts: new Date().toISOString(), level, msg: redactString(msg), ...(meta ? (redact(meta) as object) : {}) };
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(JSON.stringify(line));
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => write('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write('error', msg, meta),
};
