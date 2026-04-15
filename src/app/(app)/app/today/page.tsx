import { cookies } from "next/headers";

import { getDailySleepLibrary, getDailySleepSessionFromLibrary } from "@/lib/daily-content";
import {
  SLEEP_SESSION_COOKIE_NAME,
  parseSleepSessionState,
} from "@/lib/sleep-session-state";

import { SleepConfigPanel } from "./SleepConfigPanel";

export default async function TodayPage() {
  const library = await getDailySleepLibrary();
  const session = getDailySleepSessionFromLibrary(library);
  const cookieStore = await cookies();
  const lastSession = parseSleepSessionState(cookieStore.get(SLEEP_SESSION_COOKIE_NAME)?.value ?? null);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">BigMind Sleep</p>
        <h2 className="text-3xl font-semibold tracking-tight">Tonight’s daily sleep session</h2>
        <p className="max-w-2xl text-stone-300">
          A simple nightly practice that blends gentle guidance, Zen-inspired guidance, and a
          refreshed soundscape to make it easier to fall asleep without forcing it.
        </p>
      </section>

      {lastSession ? (
        <div className="rounded-3xl border border-stone-800 bg-stone-900/40 p-5 text-sm text-stone-300">
          Returning from your last completed session: <strong>{lastSession.focusLabel}</strong> with <strong>{lastSession.soundLabel.toLowerCase()}</strong> for <strong>{lastSession.lengthMinutes} minutes</strong>.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Tonight’s recommendation</p>
            <h3 className="mt-3 text-2xl font-semibold">{session.spokenTrack.title}</h3>
            <p className="mt-2 text-sm text-stone-500">
              {session.dateLabel} · {session.defaultLengthMinutes} minutes
            </p>
            <p className="mt-4 text-sm leading-6 text-stone-300">{session.spokenTrack.summary}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Spoken track</p>
                <p className="mt-2 text-sm font-medium text-stone-100">{session.spokenTrack.openingLine}</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-300">
                  {session.spokenTrack.structure.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Soundscape</p>
                <p className="mt-2 text-sm font-medium text-stone-100">{session.soundscape.title}</p>
                <p className="mt-2 text-sm text-stone-300">{session.soundscape.description}</p>
                <p className="mt-3 text-xs text-stone-500">
                  Texture: {session.soundscape.texture.join(" · ")}
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-300">
              Roshi blend: {session.roshiBlend}. {session.recommendationNote}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Completion goal</p>
            <p className="mt-4 text-sm text-stone-300">
              Don’t optimize for intensity. Optimize for showing up tonight and wanting to return
              tomorrow. Let BigMind Sleep be a gentle container for practice, not another thing to
              "do right."
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <SleepConfigPanel
              dateKey={session.dateKey}
              dateLabel={session.dateLabel}
              defaultFocus={session.spokenTrack.focus}
              defaultSound={session.soundscape.key}
              defaultLength={String(session.defaultLengthMinutes)}
              rememberedFocus={lastSession?.focus}
              rememberedSound={lastSession?.sound}
              rememberedLength={lastSession ? String(lastSession.lengthMinutes) : undefined}
              initialLastSession={lastSession}
              dailySpokenTracksByFocus={library.spokenTracksByFocus}
              dailySoundscapesByKey={library.soundscapesByKey}
              spokenTitle={session.spokenTrack.title}
              openingLine={session.spokenTrack.openingLine}
              structure={session.spokenTrack.structure}
              soundscapeTitle={session.soundscape.title}
            />
          </div>
          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Daily refresh rule</p>
            <p className="mt-4 text-sm text-stone-300">
              Each focus track and soundscape family now has a daily refresh path so the sleep
              experience can stay fresh instead of pulling from a static session pool.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
