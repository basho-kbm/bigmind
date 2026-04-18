'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import type {
  DailySoundscape,
  DailySpokenSection,
  DailySpokenTrack,
  SoundscapeKey,
  SleepFocusKey,
} from "@/lib/daily-content";
import {
  SLEEP_SESSION_COOKIE_NAME,
  type PersistedSleepSessionState,
} from "@/lib/sleep-session-state";

import { recordSleepSessionCompletion } from "./actions";

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
  rememberedFocus?: SleepFocusKey;
  rememberedSound?: SoundscapeKey;
  rememberedLength?: string;
  initialLastSession?: PersistedSleepSessionState | null;
  dailySpokenTracksByFocus: Record<SleepFocusKey, DailySpokenTrack>;
  dailySoundscapesByKey: Record<SoundscapeKey, DailySoundscape>;
  spokenTitle: string;
  openingLine: string;
  structure: string[];
};

const LAST_SESSION_STORAGE_KEY = "bigmind:last-sleep-session";

type SessionGuidanceSegment = {
  id: string;
  purpose: string;
  durationSeconds: number;
  text: string;
};

function buildFallbackSectionsFromTrack(track: {
  openingLine: string;
  structure: string[];
}): DailySpokenSection[] {
  return [
    {
      id: "opening",
      purpose: "help the listener settle in",
      approxMinutes: 4,
      script: track.openingLine,
    },
    {
      id: "main",
      purpose: track.structure[1] ?? track.structure[0] ?? "continue the guided meditation",
      approxMinutes: 12,
      script: [track.structure[0], track.structure[1]].filter(Boolean).join(" "),
    },
    {
      id: "closing",
      purpose: track.structure[2] ?? "soften into quiet",
      approxMinutes: 4,
      script: track.structure[2] ?? "Let the rest of the night unfold without pressure.",
    },
  ];
}

function buildGuidanceSegments(
  track: { openingLine: string; structure: string[]; sections?: DailySpokenSection[] },
  totalSeconds: number,
  soundscapeTitle: string,
): SessionGuidanceSegment[] {
  const baseSections = track.sections?.length === 3 ? track.sections : buildFallbackSectionsFromTrack(track);
  const normalizedSections = baseSections.map((section, index) => ({
    ...section,
    script:
      index === baseSections.length - 1
        ? `${section.script} Let ${soundscapeTitle.toLowerCase()} carry the rest of the night without pressure.`
        : section.script,
  }));
  const totalApproxMinutes = normalizedSections.reduce((sum, section) => sum + Math.max(section.approxMinutes, 1), 0);

  let assignedSeconds = 0;

  return normalizedSections.map((section, index) => {
    const remainingSections = normalizedSections.length - index;
    const rawSeconds = Math.round((Math.max(section.approxMinutes, 1) / totalApproxMinutes) * totalSeconds);
    const durationSeconds =
      index === normalizedSections.length - 1
        ? Math.max(45, totalSeconds - assignedSeconds)
        : Math.max(45, Math.min(totalSeconds - assignedSeconds - (remainingSections - 1) * 45, rawSeconds));

    assignedSeconds += durationSeconds;

    return {
      id: section.id,
      purpose: section.purpose,
      durationSeconds,
      text: section.script,
    };
  });
}

function getCurrentPromptIndex(prompts: SessionGuidanceSegment[], elapsedSeconds: number) {
  let elapsedBoundary = 0;

  for (let index = 0; index < prompts.length; index += 1) {
    elapsedBoundary += prompts[index]?.durationSeconds ?? 0;

    if (elapsedSeconds < elapsedBoundary) {
      return index;
    }
  }

  return Math.max(0, prompts.length - 1);
}

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

function persistSleepSessionCookie(record: PersistedSleepSessionState) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${SLEEP_SESSION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(record))}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

function persistLastSession(record: PersistedSleepSessionState) {
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
  rememberedFocus,
  rememberedSound,
  rememberedLength,
  initialLastSession = null,
  dailySpokenTracksByFocus,
  dailySoundscapesByKey,
  spokenTitle,
  openingLine,
  structure,
}: SleepConfigPanelProps) {
  const [focus, setFocus] = useState(rememberedFocus ?? defaultFocus);
  const [sound, setSound] = useState(rememberedSound ?? defaultSound);
  const [length, setLength] = useState(rememberedLength ?? defaultLength);
  const [view, setView] = useState<"config" | "active" | "complete">("config");
  const [showCustomization, setShowCustomization] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Number(rememberedLength ?? defaultLength) * 60);
  const [speechEnabled] = useState(true);
  const [lastSession, setLastSession] = useState<PersistedSleepSessionState | null>(initialLastSession);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "local-only">("idle");
  const [isPending, startTransition] = useTransition();
  const spokenPhaseRef = useRef<number | null>(null);

  const totalSeconds = Math.max(60, Number(length) * 60);
  const speechAvailable = typeof window !== "undefined" && "speechSynthesis" in window;

  const focusLabel = focusOptions.find((option) => option.value === focus)?.label ?? "Body scan";
  const soundLabel = soundOptions.find((option) => option.value === sound)?.label ?? "Ocean";
  const recommendedFocusLabel =
    focusOptions.find((option) => option.value === defaultFocus)?.label ?? "Body scan";
  const recommendedSoundLabel =
    soundOptions.find((option) => option.value === defaultSound)?.label ?? "Ocean";

  const buildSessionContent = useCallback(
    (nextFocus: SleepFocusKey, nextSound: SoundscapeKey, nextLength: string) => {
      const fallback = fallbackFocusContent[nextFocus];
      const nextTrack = dailySpokenTracksByFocus[nextFocus] ?? {
        title: nextFocus === defaultFocus ? spokenTitle : fallback.title,
        openingLine: nextFocus === defaultFocus ? openingLine : fallback.openingLine,
        structure: nextFocus === defaultFocus ? structure : fallback.structure,
      };
      const nextSoundLabel =
        soundOptions.find((option) => option.value === nextSound)?.label ?? "Ocean";
      const nextSoundscapeTitle = dailySoundscapesByKey[nextSound]?.title;
      const totalSessionSeconds = Math.max(60, Number(nextLength) * 60);

      return {
        title: nextTrack.title,
        prompts: buildGuidanceSegments(
          nextTrack,
          totalSessionSeconds,
          nextSoundscapeTitle ?? nextSoundLabel,
        ),
      };
    },
    [dailySoundscapesByKey, dailySpokenTracksByFocus, defaultFocus, openingLine, spokenTitle, structure],
  );

  const sessionContent = useMemo(
    () => buildSessionContent(focus, sound, length),
    [buildSessionContent, focus, sound, length],
  );

  const progressPercent = Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100);
  const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds);
  const currentPromptIndex = getCurrentPromptIndex(sessionContent.prompts, elapsedSeconds);
  const currentPrompt = sessionContent.prompts[currentPromptIndex]?.text ?? sessionContent.prompts[0]?.text ?? "";

  const speakPrompt = useCallback(
    (prompt: string) => {
      if (!speechAvailable || !speechEnabled || typeof window === "undefined") {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(prompt);
      utterance.rate = 0.9;
      utterance.pitch = 0.95;
      utterance.volume = 0.85;

      window.speechSynthesis.speak(utterance);
    },
    [speechAvailable, speechEnabled],
  );

  const handleComplete = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const record: PersistedSleepSessionState = {
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
    persistSleepSessionCookie(record);
    setLastSession(record);
    setView("complete");
    setIsPaused(false);
    setSaveState("saving");

    startTransition(async () => {
      const result = await recordSleepSessionCompletion({
        ...record,
        startedAt,
        speechEnabled,
      });

      setSaveState(result.ok ? "saved" : "local-only");
    });
  }, [
    dateKey,
    dateLabel,
    focus,
    focusLabel,
    length,
    sound,
    soundLabel,
    speechEnabled,
    startedAt,
    startTransition,
  ]);

  useEffect(() => {
    if (view !== "active" || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          window.setTimeout(handleComplete, 0);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [handleComplete, isPaused, view]);

  useEffect(() => {
    if (view !== "active") {
      return;
    }

    if (spokenPhaseRef.current === currentPromptIndex) {
      return;
    }

    spokenPhaseRef.current = currentPromptIndex;

    speakPrompt(currentPrompt);
  }, [currentPrompt, currentPromptIndex, speakPrompt, view]);

  useEffect(() => {
    if (!speechEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      return;
    }

    if (speechEnabled && view === "active") {
      window.setTimeout(() => speakPrompt(currentPrompt), 0);
    }
  }, [currentPrompt, speakPrompt, speechEnabled, view]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function beginSession(nextFocus: SleepFocusKey, nextSound: SoundscapeKey, nextLength: string) {
    const nextContent = buildSessionContent(nextFocus, nextSound, nextLength);

    if (speechAvailable && speechEnabled) {
      spokenPhaseRef.current = 0;
      speakPrompt(nextContent.prompts[0]?.text ?? "");
    } else {
      spokenPhaseRef.current = null;
    }

    setFocus(nextFocus);
    setSound(nextSound);
    setLength(nextLength);
    setStartedAt(new Date().toISOString());
    setSaveState("idle");
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

  function handlePauseToggle() {
    if (view !== "active") {
      return;
    }

    if (isPaused) {
      setIsPaused(false);
      window.setTimeout(() => speakPrompt(currentPrompt), 0);
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsPaused(true);
  }

  function handleReset() {
    spokenPhaseRef.current = null;
    setStartedAt(null);
    setSaveState("idle");
    setView("config");
    setShowCustomization(false);
    setFocus(lastSession?.focus ?? rememberedFocus ?? defaultFocus);
    setSound(lastSession?.sound ?? rememberedSound ?? defaultSound);
    setLength(String(lastSession?.lengthMinutes ?? rememberedLength ?? defaultLength));
    setRemainingSeconds(
      Math.max(60, Number(lastSession?.lengthMinutes ?? rememberedLength ?? defaultLength) * 60),
    );
    setIsPaused(false);
  }

  return (
    <div className="space-y-4">
      {view === "config" ? (
        <>
          <div className="space-y-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Best for tonight</p>
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
              Start now
            </button>

            {speechAvailable ? (
              <div className="rounded-2xl border border-stone-800 bg-stone-950/50 px-4 py-3 text-sm text-stone-200">
                Voice guidance is included in tonight&apos;s session.
              </div>
            ) : (
              <p className="text-xs text-stone-400">
                Voice guidance is unavailable in this browser right now, so the session will run with on-screen guidance and a timer.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-xs text-stone-300">
            {lastSession
              ? `Last completed: ${lastSession.focusLabel} with ${lastSession.soundLabel.toLowerCase()} for ${lastSession.lengthMinutes} minutes on ${formatCompletedAt(lastSession.completedAt)}.`
              : `BigMind remembers your last completed setup so starting again feels easier next time.`}
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4">
            <button
              type="button"
              onClick={() => setShowCustomization((current) => !current)}
              className="flex w-full items-center justify-between text-left text-sm font-medium text-stone-100"
            >
              <span>Adjust tonight&apos;s session</span>
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
                  Start this session
                </button>
              </form>
            ) : null}
          </div>
        </>
      ) : null}

      {view === "active" ? (
        <div className="space-y-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Tonight&apos;s session</p>
            <h3 className="text-xl font-semibold text-stone-50">{sessionContent.title}</h3>
            <p className="text-sm text-stone-300">
              {focusLabel} · {soundLabel} · {length} minutes{speechEnabled && speechAvailable ? " · voice guidance on" : ""}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Time remaining</p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl">
                  {formatSeconds(remainingSeconds)}
                </p>
              </div>
              <p className="text-right text-xs uppercase tracking-[0.2em] text-stone-400">
                {progressPercent}% complete
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-900">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${Math.max(progressPercent, 4)}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Current guidance</p>
            <p className="mt-3 text-base leading-7 text-stone-100 sm:text-lg sm:leading-8">{currentPrompt}</p>
          </div>

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={handlePauseToggle}
              className="w-full rounded-full border border-stone-700 px-4 py-3 text-sm font-medium text-stone-100 transition hover:border-stone-500 sm:w-auto"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={handleComplete}
              className="w-full rounded-full bg-emerald-400 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-emerald-300 sm:w-auto"
            >
              Complete session
            </button>
          </div>

          <p className="text-xs text-stone-400">
            Let this be easy. You do not need to do it perfectly.
          </p>
        </div>
      ) : null}

      {view === "complete" ? (
        <div className="space-y-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Session complete</p>
            <h3 className="text-xl font-semibold text-stone-50">You&apos;re done for tonight.</h3>
            <p className="text-sm text-stone-300">
              Come back tomorrow night for a fresh session.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 text-sm text-stone-300">
            Completed {focusLabel.toLowerCase()} with {soundLabel.toLowerCase()} for {length} minutes on {dateLabel}.
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 text-xs text-stone-300">
            {saveState === "saved"
              ? "Saved to your account so picking up again feels smoother next time."
              : saveState === "local-only"
                ? "Saved on this device for now."
                : saveState === "saving" || isPending
                  ? "Saving your session..."
                  : "Your session is being saved."}
          </div>

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-full bg-emerald-400 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-emerald-300 sm:w-auto"
            >
              Start another session
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}
