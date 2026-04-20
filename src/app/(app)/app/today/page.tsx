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
        <h2 className="text-3xl font-semibold tracking-tight">Choose one sleep experience and a time.</h2>
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

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="order-2 space-y-4 md:order-1">
          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Tonight’s recommendation</p>
            <h3 className="mt-3 text-2xl font-semibold">{session.spokenTrack.title}</h3>
            <p className="mt-2 text-sm text-stone-500">
              Meditation · {session.dateLabel} · {session.defaultLengthMinutes} minutes
            </p>
            <p className="mt-4 text-sm leading-6 text-stone-300">{session.spokenTrack.summary}</p>
            <div className="mt-6 rounded-2xl border border-stone-800 bg-stone-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">What it includes</p>
              <p className="mt-2 text-sm font-medium text-stone-100">{session.spokenTrack.openingLine}</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-300">
                {session.spokenTrack.structure.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6 rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-300">
              {session.recommendationNote} Other choices, including soundscapes and stories, are in the Sleep Experience menu.
            </div>
          </div>
        </div>

        <div className="order-1 space-y-4 md:order-2">
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
        </div>
      </section>
    </div>
  );
}
