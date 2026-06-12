import { prisma } from "@/lib/db";

/** Setting keys stored in the SystemSetting key/value table. */
export const SETTING_KEYS = {
  SCREENING_PASS_THRESHOLD: "SCREENING_PASS_THRESHOLD",
  LANDING_ANIMATION: "LANDING_ANIMATION",
} as const;

/** Read a raw setting value, or null if unset. */
export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

/** Read a numeric setting, falling back to `fallback` if unset or invalid. */
export async function getNumberSetting(key: string, fallback: number): Promise<number> {
  const value = await getSetting(key);
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
