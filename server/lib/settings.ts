import { prisma } from './prisma';

/**
 * Platform settings. Defaults live here; Super Admin overrides are stored in SystemSetting.
 * Nothing operational is permanently hard-coded.
 */
export const DEFAULT_SETTINGS = {
  otp: { ttlSeconds: 300, maxAttempts: 5, maxPerPhonePer15Min: 3, maxPerIpPer15Min: 10 },
  uploads: { imageMaxMb: 10, videoMaxMb: 50, documentMaxMb: 10, maxFilesPerUpload: 5 },
  links: { trackTtlHours: 24 * 30, verifyTtlHours: 24 * 7 },
  verification: { autoCloseAfterHours: 72 },
  sla: { defaultHours: 24, approachingThresholdHours: 6 },
  notifications: { maxAttempts: 6, baseBackoffSeconds: 30 },
  retention: { purgeContactAfterClosedDays: 180 },
  auth: { sessionIdleMinutes: 30, sessionAbsoluteHours: 8, maxFailedLogins: 5, lockoutMinutes: 15 },
};

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof Settings;

let cache: { at: number; value: Settings } | null = null;

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  const rows = await prisma.systemSetting.findMany();
  const merged = structuredClone(DEFAULT_SETTINGS) as Record<string, Record<string, unknown>>;
  for (const row of rows) {
    if (row.key in merged && row.value && typeof row.value === 'object') {
      merged[row.key] = { ...merged[row.key], ...(row.value as Record<string, unknown>) };
    }
  }
  cache = { at: Date.now(), value: merged as Settings };
  return cache.value;
}

export function invalidateSettings() {
  cache = null;
}
