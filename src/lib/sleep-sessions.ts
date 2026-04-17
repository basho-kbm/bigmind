import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PersistedSleepSessionState } from "@/lib/sleep-session-state";

export type SleepSessionRecord = {
  id: string;
  user_id: string;
  date_key: string;
  date_label: string;
  focus: string;
  focus_label: string;
  sound: string;
  sound_label: string;
  length_minutes: number;
  speech_enabled: boolean;
  started_at: string | null;
  completed_at: string;
  created_at: string;
};

export async function getLatestSleepSession(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("sleep_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle<SleepSessionRecord>();

  if (error) {
    return null;
  }

  if (!data) {
    return null;
  }

  return toPersistedSleepSessionState(data);
}

export function toPersistedSleepSessionState(record: SleepSessionRecord): PersistedSleepSessionState {
  return {
    dateKey: record.date_key,
    dateLabel: record.date_label,
    focus: record.focus as PersistedSleepSessionState["focus"],
    focusLabel: record.focus_label,
    sound: record.sound as PersistedSleepSessionState["sound"],
    soundLabel: record.sound_label,
    lengthMinutes: record.length_minutes,
    completedAt: record.completed_at,
  };
}
