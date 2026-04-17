"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { PersistedSleepSessionState } from "@/lib/sleep-session-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const sleepSessionCompletionSchema = z.object({
  dateKey: z.string().min(1),
  dateLabel: z.string().min(1),
  focus: z.string().min(1),
  focusLabel: z.string().min(1),
  sound: z.string().min(1),
  soundLabel: z.string().min(1),
  lengthMinutes: z.number().int().positive(),
  completedAt: z.string().min(1),
  startedAt: z.string().datetime().nullable().optional(),
  speechEnabled: z.boolean().default(false),
});

type RecordSleepSessionCompletionInput = PersistedSleepSessionState & {
  startedAt?: string | null;
  speechEnabled?: boolean;
};

export async function recordSleepSessionCompletion(input: RecordSleepSessionCompletionInput) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, reason: "unauthenticated" };
  }

  const parsed = sleepSessionCompletionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, reason: "invalid" };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("sleep_sessions").insert({
    user_id: user.id,
    date_key: parsed.data.dateKey,
    date_label: parsed.data.dateLabel,
    focus: parsed.data.focus,
    focus_label: parsed.data.focusLabel,
    sound: parsed.data.sound,
    sound_label: parsed.data.soundLabel,
    length_minutes: parsed.data.lengthMinutes,
    speech_enabled: parsed.data.speechEnabled,
    started_at: parsed.data.startedAt ?? null,
    completed_at: parsed.data.completedAt,
  });

  if (error) {
    return { ok: false as const, reason: "db", message: error.message };
  }

  revalidatePath("/app");
  revalidatePath("/app/today");

  return { ok: true as const };
}
