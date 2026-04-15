'use client';

import { useEffect, useMemo, useRef, useState } from "react";

import type { SoundscapeKey, SleepFocusKey } from "@/lib/daily-content";

const focusOptions = [
  { value: "body_scan", label: "Body scan" },
  { value: "open_awareness", label: "Open awareness" },
  { value: "breath", label: "Breath awareness" },
  { value: "zen_self", label: "Zen teaching: self" },
  { value: "zen_impermanence", label: "Zen teaching: impermanence" },
  { value: "zen_emptiness", label: "Zen teaching: emptiness" },
  { value: "zen_beginner", label: "Zen teaching: beginner's mind" },
  { value: "zen_stories", label: "Zen stories" },
] as const;

const soundOptions = [
  { value: "ocean", label: "Ocean" },
  { value: "forest", label: "Forest" },
  { value: "orchestra", label: "Orchestra warm-up" },
  { value: "jungle", label: "Jungle" },
] as const;

const lengthOptions = [
  { value: "10", label: "10 minutes" },
  { value: "20", label: "20 minutes (recommended)" },
  { value: "30", label: "30 minutes" },
] as const;

const fallbackFocusContent: Record<
  SleepFocusKey,
  { title: string; openingLine: string; structure: string[] }
> = {
  body_scan: {
    title: "Soft arrival body scan",
    openingLine: "Nothing to solve tonight. Just feel the body being here.",
    structure: [
      "Relax the face, jaw, shoulders, chest, belly, hips, and legs in order.",
      "Let each exhale soften one more area of the body.",
      "Settle into stillness without trying to force sleep.",
    ],
  },
  open_awareness: {
    title: "Night sky awareness",
    openingLine: "Let the mind be wide enough that thoughts do not need to be fought.",
    structure: [
      "Notice sounds, breath, and sensation without choosing favorites.",
      "Let attention stay open instead of narrow and effortful.",
      "Drift into silence without trying to finish perfectly.",
    ],
  },
  breath: {
    title: "Low-friction breath awareness",
    openingLine: "If the mind is busy, give it one soft job: follow one breath at a time.",
    structure: [
      "Count a few gentle exhales to steady attention.",
      "Restart softly whenever the mind wanders.",
      "Release the counting and let breath continue on its own.",
    ],
  },
  zen_self: {
    title: "Self, lightly held",
    openingLine: "You do not need to carry your whole identity into sleep tonight.",
    structure: [
      "Settle the body first so the teaching lands softly.",
      "Hear a short reflection on loosening self-story.",
      "Return to breath and sound without needing to resolve anything.",
    ],
  },
  zen_impermanence: {
    title: "Impermanence and easing",
    openingLine: "Even this restless mind is changing, moment by moment.",
    structure: [
      "Notice the changing texture of breath and sensation.",
      "Hear a short reflection on things moving when they are not gripped.",
      "Let that loosen the pressure to fix the night.",
    ],
  },
  zen_emptiness: {
    title: "Roominess before sleep",
    openingLine: "Make a little more room around every thought and feeling.",
    structure: [
      "Relax the body into the bed.",
      "Hear a short reflection on roominess and non-grasping.",
      "Let sound and breath carry the rest.",
    ],
  },
  zen_beginner: {
    title: "Beginner’s mind at bedtime",
    openingLine: "Tonight, meet this moment without needing to be good at it.",
    structure: [
      "Drop the idea of doing meditation correctly.",
      "Hear one short beginner’s mind reflection.",
      "Settle into a gentler, lower-pressure night.",
    ],
  },
  zen_stories: {
    title: "The lantern story",
    openingLine: "A traveler asked for the road at night, and the old teacher lifted a lantern.",
    structure: [
      "Listen to a short story without trying to interpret it too hard.",
      "Let one simple takeaway land lightly.",
      "Fade back into breath and sound.",
    ],
  },
};

type SleepConfigPanelProps = {
  dateKey: string;
  dateLabel: string;
  defaultFocus?: SleepFocusKey;
  defaultSound?: SoundscapeKey;
  defaultLength?: string;
  spokenTitle: string;
  openingLine: string;
  structure: string[];
  soundscapeTitle: string;
};

type SessionHistoryRecord = {
  dateKey: string;
  dateLabel: string;
  focus: SleepFocusKey;
  focusLabel: string;
  sound: SoundscapeKey;
  soundLabel: string;
  lengthMinutes: number;
  completedAt: string;
};

const LAST_SESSION_STORAGE_KEY = "bigmind:last-sleep-session";

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function formatCompletedAt(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function readLastSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LAST_SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionHistoryRecord;
  } catch {
    return null;
  }
}

function persistLastSession(record: SessionHistoryRecord) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAST_SESSION_STORAGE_KEY, JSON.stringify(record));
}

export function SleepConfigPanel({
  dateKey,
  dateLabel,
  defaultFocus = "body_scan",
  defaultSound = "ocean",
  defaultLength = "20",
  spokenTitle,
  openingLine,
  structure,
  soundscapeTitle,
}: SleepConfigPanelProps) {
  const [focus, setFocus] = useState(defaultFocus);
  const [sound, setSound] = useState(defaultSound);
  const [length, setLength] = useState(defaultLength);
  const [view, setView] = useState<"config" | "active" | "complete">("config");
  const [showCustomization, setShowCustomization] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Number(defaultLength) * 60);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [lastSession, setLastSession] = useState<SessionHistoryRecord | null>(null);
  const spokenPhaseRef = useRef<number | null>(null);

  const totalSeconds = Math.max(60, Number(length) * 60);

  const focusLabel = focusOptions.find((option) => option.value === focus)?.label ?? "Body scan";
  const soundLabel = soundOptions.find((option) => option.value === sound)?.label ?? "Ocean";
  const recommendedFocusLabel =
    focusOptions.find((option) => option.value === defaultFocus)?.label ?? "Body scan";
  const recommendedSoundLabel =
    soundOptions.find((option) => option.value === defaultSound)?.label ?? "Ocean";

  const sessionContent = useMemo(() => {
    const fallback = fallbackFocusContent[focus];
    const useRecommendedTrack = focus === defaultFocus;

    return {
      title: useRecommendedTrack ? spokenTitle : fallback.title,
      prompts: [
        useRecommendedTrack ? openingLine : fallback.openingLine,
        ...(useRecommendedTrack ? structure : fallback.structure),
        `Let ${soundLabel.toLowerCase()} carry the rest of the night without pressure.`,
      ],
    };
  }, [defaultFocus, focus, openingLine, soundLabel, spokenTitle, structure]);

  const progressPercent = Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100);
  const currentPromptIndex = Math.min(
    sessionContent.prompts.length - 1,
    Math.floor(((totalSeconds - remainingSeconds) / totalSeconds) * sessionContent.prompts.length),
  );
  const currentPrompt = sessionContent.prompts[currentPromptIndex] ?? sessionContent.prompts[0];

  useEffect(() => {
    setSpeechAvailable(typeof window !== "undefined" && "speechSynthesis" in window);
    setLastSession(readLastSession());
  }, []);

  useEffect(() => {
    if (view === "config") {
      setRemainingSeconds(totalSeconds);
      setIsPaused(false);
    }
  }, [totalSeconds, view]);

  useEffect(() => {
    if (view !== "active" || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isPaused, view]);

  useEffect(() => {
    if (view !== "active" || remainingSeconds !== 0) {
      return;
    }

    handleComplete();
  }, [remainingSeconds, view]);

  useEffect(() => {
    if (view !== "active") {
      return;
    }

    if (spokenPhaseRef.current === currentPromptIndex) {
      return;
    }

    spokenPhaseRef.current = currentPromptIndex;

    if (!speechAvailable || !speechEnabled || typeof window === "undefined") {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentPrompt);
    utterance.rate = 0.9;
    utterance.pitch = 0.95;
    utterance.volume = 0.85;

    window.speechSynthesis.speak(utterance);
  }, [currentPrompt, currentPromptIndex, speechAvailable, speechEnabled, view]);

  useEffect(() => {
    if (!speechEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [speechEnabled]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function beginSession(nextFocus: SleepFocusKey, nextSound: SoundscapeKey, nextLength: string) {
    spokenPhaseRef.current = null;
    setFocus(nextFocus);
    setSound(nextSound);
    setLength(nextLength);
    setRemainingSeconds(Math.max(60, Number(nextLength) * 60));
    setIsPaused(false);
    setView("active");
  }

  function handleStartRecommended() {
    beginSession(defaultFocus, defaultSound, defaultLength);
  }

  function handleStartCustom(event: React.FormEvent) {
    event.preventDefault();
    beginSession(focus, sound, length);
  }

  function handleComplete() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const record: SessionHistoryRecord = {
      dateKey,
      dateLabel,
      focus,
      focusLabel,
      sound,
      soundLabel,
      lengthMinutes: Number(length),
      completedAt: new Date().toISOString(),
    };

    persistLastSession(record);
    setLastSession(record);
    setView("complete");
    setIsPaused(false);
  }

  function handleReset() {
    spokenPhaseRef.current = null;
    setView("config");
    setShowCustomization(false);
    setFocus(defaultFocus);
    setSound(defaultSound);
    setLength(defaultLength);
    setRemainingSeconds(Math.max(60, Number(defaultLength) * 60));
    setIsPaused(false);
  }

  return (
    <div className="space-y-4">
      {view === "config" ? (
        <>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Tonight’s fastest path</p>
            <p className="text-sm text-stone-300">
              Start the recommended session immediately. Customize only if you want to.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Recommended tonight</p>
              <h3 className="text-xl font-semibold text-stone-50">{spokenTitle}</h3>
              <p className="text-sm text-stone-300">
                {recommendedFocusLabel} · {recommendedSoundLabel} · {defaultLength} minutes
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartRecommended}
              className="w-full rounded-full bg-emerald-400 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Start tonight&apos;s recommended session
            </button>

            {speechAvailable ? (
              <label className="flex items-center gap-3 rounded-2xl border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm text-stone-200">
                <input
                  type="checkbox"
                  checked={speechEnabled}
                  onChange={(event) => setSpeechEnabled(event.target.checked)}
                  className="h-4 w-4 rounded border-stone-600 bg-stone-950 text-emerald-400"
                />
                <span>Use browser-spoken guidance (beta)</span>
              </label>
            ) : (
              <p className="text-xs text-stone-400">
                Browser-spoken guidance is unavailable here, so the session runs with on-screen prompts and a timer.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4">
            <button
              type="button"
              onClick={() => setShowCustomization((current) => !current)}
              className="flex w-full items-center justify-between text-left text-sm font-medium text-stone-100"
            >
              <span>Customize tonight instead</span>
              <span className="text-stone-400">{showCustomization ? "Hide" : "Show"}</span>
            </button>

            {showCustomization ? (
              <form onSubmit={handleStartCustom} className="mt-4 space-y-4 text-sm text-stone-200">
                <div className="space-y-2">
                  <p className="font-medium text-stone-100">Focus</p>
                  <select
                    value={focus}
                    onChange={(event) => setFocus(event.target.value as SleepFocusKey)}
                    className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-3 py-2 text-sm text-stone-100 outline-none ring-0 focus:border-emerald-400/60"
                  >
                    {focusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-stone-100">Soundscape</p>
                  <select
                    value={sound}
                    onChange={(event) => setSound(event.target.value as SoundscapeKey)}
                    className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-3 py-2 text-sm text-stone-100 outline-none ring-0 focus:border-emerald-400/60"
                  >
                    {soundOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-stone-100">Length</p>
                  <select
                    value={length}
                    onChange={(event) => setLength(event.target.value)}
                    className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-3 py-2 text-sm text-stone-100 outline-none ring-0 focus:border-emerald-400/60"
                  >
                    {lengthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full border border-stone-700 px-4 py-3 text-sm font-medium text-stone-100 transition hover:border-stone-500"
                >
                  Start custom session
                </button>
              </form>
            ) : null}
          </div>
        </>
      ) : null}

      {view === "active" ? (
        <div className="space-y-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Session live</p>
            <h3 className="text-xl font-semibold text-stone-50">{sessionContent.title}</h3>
            <p className="text-sm text-stone-300">
              {focusLabel} · {soundLabel} · {length} minutes{speechEnabled && speechAvailable ? " · spoken guidance on" : ""}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-stone-400">
              <span>Progress</span>
              <span>{formatSeconds(remainingSeconds)} remaining</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-900">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${Math.max(progressPercent, 4)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Current guidance</p>
            <p className="mt-3 text-base leading-7 text-stone-100">{currentPrompt}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsPaused((current) => !current)}
              className="rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-500"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={handleComplete}
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Complete session
            </button>
          </div>

          <p className="text-xs text-stone-400">
            The goal is not intensity. The goal is giving your attention a calmer place to land tonight.
          </p>
        </div>
      ) : null}

      {view === "complete" ? (
        <div className="space-y-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Session complete</p>
            <h3 className="text-xl font-semibold text-stone-50">Nice. You showed up tonight.</h3>
            <p className="text-sm text-stone-300">
              Come back tomorrow night for a refreshed session. BigMind Sleep should feel alive, not static.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 text-sm text-stone-300">
            Completed {focusLabel.toLowerCase()} with {soundLabel.toLowerCase()} for {length} minutes on {dateLabel}.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Start another session
            </button>
          </div>
        </div>
      ) : null}

      {lastSession ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-xs text-stone-300">
          Last completed: {lastSession.focusLabel} with {lastSession.soundLabel.toLowerCase()} for {lastSession.lengthMinutes} minutes on {formatCompletedAt(lastSession.completedAt)}.
        </div>
      ) : null}
    </div>
  );
}
