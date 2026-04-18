import { cookies } from "next/headers";

import { requireUser } from "@/lib/auth";
import { getDailySleepLibrary, getDailySleepSessionFromLibrary } from "@/lib/daily-content";
import { getLatestSleepSession } from "@/lib/sleep-sessions";
import {
  SLEEP_SESSION_COOKIE_NAME,
  parseSleepSessionState,
} from "@/lib/sleep-session-state";

import { SleepConfigPanel } from "./SleepConfigPanel";

export default async function TodayPage() {
  const user = await requireUser();
  const library = await getDailySleepLibrary();
  const session = getDailySleepSessionFromLibrary(library);
  const cookieStore = await cookies();
  const cookieLastSession = parseSleepSessionState(cookieStore.get(SLEEP_SESSION_COOKIE_NAME)?.value ?? null);
  const databaseLastSession = await getLatestSleepSession(user.id);
  const lastSession = databaseLastSession ?? cookieLastSession;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">BigMind Sleep</p>
        <h2 className="text-3xl font-semibold tracking-tight">Ready for tonight’s session?</h2>
        <p className="max-w-2xl text-stone-300">
          Start quickly, or shape tonight’s session around the kind of calm you need.
        </p>
      </section>

      {lastSession ? (
        <div className="rounded-3xl border border-stone-800 bg-stone-900/40 p-5 text-sm text-stone-300">
          Last time you finished <strong>{lastSession.focusLabel}</strong> with <strong>{lastSession.soundLabel.toLowerCase()}</strong> for <strong>{lastSession.lengthMinutes} minutes</strong>.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="order-2 space-y-4 md:order-1">
          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Best for tonight</p>
            <h3 className="mt-3 text-2xl font-semibold">{session.spokenTrack.title}</h3>
            <p className="mt-2 text-sm text-stone-500">
              {session.dateLabel} · {session.defaultLengthMinutes} minutes
            </p>
            <p className="mt-4 text-sm leading-6 text-stone-300">{session.spokenTrack.summary}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Guidance</p>
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
              Calm Zen-inspired voice guidance, paired with a soundscape designed to stay easy to drift off to. {session.recommendationNote}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">What to aim for</p>
            <p className="mt-4 text-sm text-stone-300">
              Let this feel easy. You do not need a perfect meditation. You just need a calmer place
              for your attention to land tonight.
            </p>
          </div>
        </div>

        <div className="order-1 space-y-4 md:order-2">
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
            />
          </div>
          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Fresh each day</p>
            <p className="mt-4 text-sm text-stone-300">
              Guidance and soundscapes refresh daily so tonight feels current, not recycled.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
