import 'dotenv/config';
import { z } from 'zod';

const isProd = process.env.NODE_ENV === 'production';

/** Dev-only fallback secrets so the app boots locally. Production refuses to start without real ones. */
const devDefault = (v: string) => (isProd ? z.string().min(32) : z.string().min(32).default(v));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  TRUST_PROXY: z.coerce.number().default(0),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),

  // Secrets — each MUST be a distinct long random value in production
  SESSION_SECRET: devDefault('dev-session-secret-change-me-0000000000000000'),
  LINK_SIGNING_SECRET: devDefault('dev-link-signing-secret-change-me-00000000000'),
  OTP_PEPPER: devDefault('dev-otp-pepper-change-me-000000000000000000000'),
  PHONE_HASH_KEY: devDefault('dev-phone-hash-key-change-me-00000000000000000'),
  /** 32 bytes base64 for AES-256-GCM */
  DATA_ENCRYPTION_KEY: isProd
    ? z.string().min(40)
    : z.string().min(40).default('ZGV2LWRhdGEtZW5jcnlwdGlvbi1rZXktMzJieXRlcyE='),

  // WhatsApp
  WHATSAPP_PROVIDER: z.enum(['console', 'meta']).default('console'),
  WHATSAPP_META_TOKEN: z.string().optional(),
  WHATSAPP_META_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_META_APP_SECRET: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_TEMPLATE_LANG: z.string().default('en'),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage/private'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  // Malware scanning (ClamAV clamd). Empty = scanning skipped (dev only)
  CLAMAV_HOST: z.string().optional(),
  CLAMAV_PORT: z.coerce.number().default(3310),

  ESCALATION_INTERVAL_SECONDS: z.coerce.number().default(300),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Do not print values — only which keys are invalid.
  console.error('Invalid environment configuration:', parsed.error.issues.map((i) => i.path.join('.')).join(', '));
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProd,
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
};

if (isProd) {
  if (config.WHATSAPP_PROVIDER !== 'meta') {
    console.error('Production requires WHATSAPP_PROVIDER=meta');
    process.exit(1);
  }
  if (!config.CLAMAV_HOST) console.warn('[security] CLAMAV_HOST not set — uploaded files will not be malware scanned.');
}
