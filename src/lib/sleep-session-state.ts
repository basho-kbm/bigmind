import type { SoundscapeKey, SleepFocusKey } from "@/lib/daily-content";

export const SLEEP_SESSION_COOKIE_NAME = "bigmind-last-session";

export type PersistedSleepSessionState = {
  dateKey: string;
  dateLabel: string;
  focus: SleepFocusKey;
  focusLabel: string;
  sound: SoundscapeKey;
  soundLabel: string;
  lengthMinutes: number;
  completedAt: string;
};

export function parseSleepSessionState(raw?: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSleepSessionState>;

    if (
      typeof parsed.dateKey !== "string" ||
      typeof parsed.dateLabel !== "string" ||
      typeof parsed.focus !== "string" ||
      typeof parsed.focusLabel !== "string" ||
      typeof parsed.sound !== "string" ||
      typeof parsed.soundLabel !== "string" ||
      typeof parsed.lengthMinutes !== "number" ||
      typeof parsed.completedAt !== "string"
    ) {
      return null;
    }

    return parsed as PersistedSleepSessionState;
  } catch {
    return null;
  }
}
