import { cookies } from "next/headers";

import { requireUser } from "@/lib/auth";
import { getDailySleepLibrary, getDailySleepSessionFromLibrary } from "@/lib/daily-content";
import {
  SLEEP_SESSION_COOKIE_NAME,
  parseSleepSessionState,
} from "@/lib/sleep-session-state";
import { getLatestSleepSession } from "@/lib/sleep-sessions";

import { SleepConfigPanel } from "./SleepConfigPanel";

export default async function TodayPage() {
  const user = await requireUser();
  const library = await getDailySleepLibrary();
  const session = getDailySleepSessionFromLibrary(library);
  const cookieStore = await cookies();
  const cookieLastSession = parseSleepSessionState(
    cookieStore.get(SLEEP_SESSION_COOKIE_NAME)?.value ?? null,
  );
  const databaseLastSession = await getLatestSleepSession(user.id);
  const lastSession = databaseLastSession ?? cookieLastSession;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Tonight</p>
        <h2 className="text-3xl font-semibold tracking-tight">Configure your own sleep experience.</h2>
        <p className="max-w-2xl text-stone-300">
          Pick a meditation, story, or soundscape, then start tonight’s session.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Recommended tonight</p>
          <p className="mt-2 text-base font-medium text-stone-100">{session.spokenTrack.title}</p>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Type</p>
          <p className="mt-2 text-base font-medium text-stone-100">Meditation</p>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Time</p>
          <p className="mt-2 text-base font-medium text-stone-100">{session.defaultLengthMinutes} min</p>
        </div>
      </section>

      {lastSession ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4 text-sm text-stone-300">
          Last time you finished <strong>{lastSession.focusLabel}</strong> for <strong>{lastSession.lengthMinutes} minutes</strong>.
        </div>
      ) : null}

      <section>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <SleepConfigPanel
            dateKey={session.dateKey}
            dateLabel={session.dateLabel}
            defaultExperienceKey={session.spokenTrack.focus}
            defaultLength={String(session.defaultLengthMinutes)}
            rememberedExperienceKey={lastSession?.focus}
            rememberedLength={lastSession ? String(lastSession.lengthMinutes) : undefined}
            initialLastSession={lastSession}
            dailySpokenTracksByFocus={library.spokenTracksByFocus}
            dailySoundscapesByKey={library.soundscapesByKey}
          />
        </div>
      </section>
    </div>
  );
}
