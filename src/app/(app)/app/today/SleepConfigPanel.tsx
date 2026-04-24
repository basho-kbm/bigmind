'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import type {
  DailySoundscape,
  DailySpokenSection,
  DailySpokenTrack,
  DailyVoiceDirection,
  SoundscapeKey,
  SleepFocusKey,
} from "@/lib/daily-content";
import {
  SLEEP_SESSION_COOKIE_NAME,
  type PersistedSleepSessionState,
} from "@/lib/sleep-session-state";

import { recordSleepSessionCompletion } from "./actions";

const spokenOrder: SleepFocusKey[] = [
  "body_scan",
  "open_awareness",
  "breath",
  "zen_self",
  "zen_impermanence",
  "zen_emptiness",
  "zen_beginner",
  "zen_stories",
];

const soundscapeOrder: SoundscapeKey[] = ["ocean", "forest", "orchestra", "jungle"];

const lengthOptions = [
  { value: "10", label: "10 minutes" },
  { value: "20", label: "20 minutes" },
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
      "Return to stillness without needing to resolve anything.",
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
      "Let spaciousness do some of the easing.",
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
      "Fade back into quiet.",
    ],
  },
};

type SleepExperienceKey = SleepFocusKey | SoundscapeKey;
type SleepExperienceKind = "meditation" | "story" | "soundscape";

type SleepExperienceOption = {
  value: SleepExperienceKey;
  title: string;
  kind: SleepExperienceKind;
  kindLabel: string;
  summary: string;
  previewLine: string;
  details: string[];
  defaultLength: string;
  voiceEnabled: boolean;
  voiceDirection?: DailyVoiceDirection;
  sections?: DailySpokenSection[];
};

type SleepConfigPanelProps = {
  dateKey: string;
  dateLabel: string;
  defaultExperienceKey?: SleepExperienceKey;
  defaultLength?: string;
  rememberedExperienceKey?: string;
  rememberedLength?: string;
  initialLastSession?: PersistedSleepSessionState | null;
  dailySpokenTracksByFocus: Record<SleepFocusKey, DailySpokenTrack>;
  dailySoundscapesByKey: Record<SoundscapeKey, DailySoundscape>;
};

const LAST_SESSION_STORAGE_KEY = "bigmind:last-sleep-session";

type SessionGuidanceSegment = {
  id: string;
  purpose: string;
  durationSeconds: number;
  text: string;
};

type SessionContent = {
  title: string;
  kindLabel: string;
  summary: string;
  prompts: SessionGuidanceSegment[];
  voiceDirection?: DailyVoiceDirection;
  voiceEnabled: boolean;
  restingNote: string;
};

type RenderedAudioSegment = {
  id: string;
  durationSeconds: number;
  audioUrl: string;
};

function base64ToBlobUrl(base64: string, mimeType: string) {
  const binary = window.atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });

  return URL.createObjectURL(blob);
}

function getKindLabel(kind: SleepExperienceKind) {
  switch (kind) {
    case "meditation":
      return "Meditation";
    case "story":
      return "Story";
    case "soundscape":
      return "Soundscape";
  }
}

function sanitizeExperienceText(value: string) {
  return value
    .replace(/breath and soundscape/gi, "quiet")
    .replace(/breath and sound/gi, "quiet")
    .replace(/soundscape/gi, "session")
    .replace(/soundscapes/gi, "sessions");
}

function sanitizeSections(sections?: DailySpokenSection[]) {
  return sections?.map((section) => ({
    ...section,
    purpose: sanitizeExperienceText(section.purpose),
    script: sanitizeExperienceText(section.script),
    cues: section.cues?.map((cue) => sanitizeExperienceText(cue)),
  }));
}

function normalizeCueText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitCueParts(script: string) {
  const normalized = normalizeCueText(script);

  if (!normalized) {
    return [] as string[];
  }

  const sentenceParts = normalized
    .split(/(?<=[.!?])\s+/)
    .map(normalizeCueText)
    .filter(Boolean);

  const expandedParts = sentenceParts.flatMap((part) => {
    if (part.length <= 120) {
      return [part];
    }

    return part
      .split(/,\s+|;\s+/)
      .map(normalizeCueText)
      .filter(Boolean);
  });

  return expandedParts.length > 0 ? expandedParts : [normalized];
}

function buildCueTexts(script: string, approxMinutes: number) {
  const parts = splitCueParts(script);

  if (parts.length === 0) {
    return [] as string[];
  }

  const targetCueCount = Math.max(2, Math.min(5, Math.round(approxMinutes / 3)));
  const cueCount = Math.max(1, Math.min(targetCueCount, parts.length));
  const cues: string[] = [];
  let cursor = 0;

  for (let index = 0; index < cueCount; index += 1) {
    const remainingParts = parts.length - cursor;
    const remainingCues = cueCount - index;
    const take = Math.max(1, Math.ceil(remainingParts / remainingCues));
    const cue = normalizeCueText(parts.slice(cursor, cursor + take).join(" "));

    if (cue) {
      cues.push(cue);
    }

    cursor += take;
  }

  return cues;
}

function getSpeechSettings(voiceDirection?: DailyVoiceDirection) {
  const profile = [
    voiceDirection?.pace,
    voiceDirection?.tone,
    voiceDirection?.emphasis,
    voiceDirection?.pauseStyle,
    ...(voiceDirection?.avoid ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let rate = 0.9;
  let pitch = 0.95;
  let volume = 0.85;

  if (/(unhurried|slow|slower|spacious|deliberate|room between thoughts)/.test(profile)) {
    rate -= 0.08;
  }

  if (/(grounded|low-drama|lightly austere|steady)/.test(profile)) {
    pitch -= 0.07;
  }

  if (/(warm|intimate|gentle)/.test(profile)) {
    volume += 0.02;
  }

  if (/(whisper|asmr|cheerful|theatrical)/.test(profile)) {
    pitch = Math.max(0.84, pitch - 0.03);
    rate = Math.max(0.78, rate - 0.02);
  }

  return {
    rate: Math.min(1, Math.max(0.78, rate)),
    pitch: Math.min(1.05, Math.max(0.84, pitch)),
    volume: Math.min(0.92, Math.max(0.75, volume)),
  };
}

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
      cues: buildCueTexts(track.openingLine, 4),
    },
    {
      id: "main",
      purpose: track.structure[1] ?? track.structure[0] ?? "continue the sleep experience",
      approxMinutes: 12,
      script: [track.structure[0], track.structure[1]].filter(Boolean).join(" "),
      cues: buildCueTexts([track.structure[0], track.structure[1]].filter(Boolean).join(" "), 12),
    },
    {
      id: "closing",
      purpose: track.structure[2] ?? "soften into quiet",
      approxMinutes: 4,
      script: track.structure[2] ?? "Let the rest of the night unfold without pressure.",
      cues: buildCueTexts(track.structure[2] ?? "Let the rest of the night unfold without pressure.", 4),
    },
  ];
}

function buildGuidanceSegments(
  track: { openingLine: string; structure: string[]; sections?: DailySpokenSection[] },
  totalSeconds: number,
): SessionGuidanceSegment[] {
  const baseSections =
    track.sections?.length === 3 ? track.sections : buildFallbackSectionsFromTrack(track);
  const normalizedSections = baseSections.map((section) => ({
    ...section,
    cues:
      section.cues?.filter(Boolean).slice(0, 5) ?? buildCueTexts(section.script, section.approxMinutes),
  }));
  const totalApproxMinutes = normalizedSections.reduce(
    (sum, section) => sum + Math.max(section.approxMinutes, 1),
    0,
  );

  let assignedSectionSeconds = 0;
  const prompts: SessionGuidanceSegment[] = [];

  normalizedSections.forEach((section, sectionIndex) => {
    const remainingSections = normalizedSections.length - sectionIndex;
    const rawSectionSeconds = Math.round(
      (Math.max(section.approxMinutes, 1) / totalApproxMinutes) * totalSeconds,
    );
    const sectionDurationSeconds =
      sectionIndex === normalizedSections.length - 1
        ? Math.max(45, totalSeconds - assignedSectionSeconds)
        : Math.max(
            45,
            Math.min(
              totalSeconds - assignedSectionSeconds - (remainingSections - 1) * 45,
              rawSectionSeconds,
            ),
          );

    assignedSectionSeconds += sectionDurationSeconds;

    const cueTexts = section.cues?.length ? section.cues : [section.script];
    const cueWeights = cueTexts.map((cue) => Math.max(8, cue.split(/\s+/).filter(Boolean).length));
    const totalCueWeight = cueWeights.reduce((sum, weight) => sum + weight, 0);
    const minCueSeconds = Math.max(
      18,
      Math.floor(sectionDurationSeconds / Math.max(cueTexts.length * 2, 1)),
    );
    let assignedCueSeconds = 0;

    cueTexts.forEach((cue, cueIndex) => {
      const remainingCueCount = cueTexts.length - cueIndex;
      const rawCueSeconds = Math.round((cueWeights[cueIndex] / totalCueWeight) * sectionDurationSeconds);
      const durationSeconds =
        cueIndex === cueTexts.length - 1
          ? Math.max(minCueSeconds, sectionDurationSeconds - assignedCueSeconds)
          : Math.max(
              minCueSeconds,
              Math.min(
                sectionDurationSeconds - assignedCueSeconds - (remainingCueCount - 1) * minCueSeconds,
                rawCueSeconds,
              ),
            );

      assignedCueSeconds += durationSeconds;

      prompts.push({
        id: `${section.id}-${cueIndex + 1}`,
        purpose: section.purpose,
        durationSeconds,
        text: cue,
      });
    });
  });

  return prompts;
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

function buildExperienceOptions(params: {
  dailySpokenTracksByFocus: Record<SleepFocusKey, DailySpokenTrack>;
  dailySoundscapesByKey: Record<SoundscapeKey, DailySoundscape>;
}) {
  const meditations: SleepExperienceOption[] = [];
  const stories: SleepExperienceOption[] = [];
  const soundscapes: SleepExperienceOption[] = [];

  spokenOrder.forEach((focus) => {
    const fallback = fallbackFocusContent[focus];
    const track = params.dailySpokenTracksByFocus[focus] ?? {
      title: fallback.title,
      openingLine: fallback.openingLine,
      structure: fallback.structure,
      durationMinutes: 20,
      summary: fallback.structure.join(" "),
      voiceDirection: undefined,
      sections: undefined,
    };
    const kind: SleepExperienceKind = focus === "zen_stories" ? "story" : "meditation";
    const option: SleepExperienceOption = {
      value: focus,
      title: sanitizeExperienceText(track.title),
      kind,
      kindLabel: getKindLabel(kind),
      summary: sanitizeExperienceText(track.summary),
      previewLine: sanitizeExperienceText(track.openingLine),
      details: track.structure.map((item) => sanitizeExperienceText(item)),
      defaultLength: String(track.durationMinutes ?? 20),
      voiceEnabled: true,
      voiceDirection: track.voiceDirection,
      sections: sanitizeSections(track.sections),
    };

    if (kind === "story") {
      stories.push(option);
      return;
    }

    meditations.push(option);
  });

  soundscapeOrder.forEach((key) => {
    const soundscape = params.dailySoundscapesByKey[key];

    soundscapes.push({
      value: key,
      title: soundscape.title,
      kind: "soundscape",
      kindLabel: getKindLabel("soundscape"),
      summary: soundscape.description,
      previewLine: soundscape.description,
      details: soundscape.texture,
      defaultLength: "20",
      voiceEnabled: false,
    });
  });

  return {
    all: [...meditations, ...stories, ...soundscapes],
    meditations,
    stories,
    soundscapes,
  };
}

function buildSessionContent(option: SleepExperienceOption, totalSeconds: number): SessionContent {
  if (option.kind === "soundscape") {
    return {
      title: option.title,
      kindLabel: option.kindLabel,
      summary: option.summary,
      prompts: [
        {
          id: "soundscape",
          purpose: "soundscape only",
          durationSeconds: totalSeconds,
          text: `Let ${option.title.toLowerCase()} fill the room. Nothing else to follow tonight.`,
        },
      ],
      voiceEnabled: false,
      restingNote: "This is a soundscape-only experience. Let the sound do the work.",
    };
  }

  return {
    title: option.title,
    kindLabel: option.kindLabel,
    summary: option.summary,
    prompts: buildGuidanceSegments(
      {
        openingLine: option.previewLine,
        structure: option.details,
        sections: option.sections,
      },
      totalSeconds,
    ),
    voiceDirection: option.voiceDirection,
    voiceEnabled: true,
    restingNote: "Let this feel easy. You do not need to do it perfectly.",
  };
}

export function SleepConfigPanel({
  dateKey,
  dateLabel,
  defaultExperienceKey = "body_scan",
  defaultLength = "20",
  rememberedExperienceKey,
  rememberedLength,
  initialLastSession = null,
  dailySpokenTracksByFocus,
  dailySoundscapesByKey,
}: SleepConfigPanelProps) {
  const experienceGroups = useMemo(
    () => buildExperienceOptions({ dailySpokenTracksByFocus, dailySoundscapesByKey }),
    [dailySoundscapesByKey, dailySpokenTracksByFocus],
  );

  const recommendedExperience =
    experienceGroups.all.find((option) => option.value === defaultExperienceKey) ?? experienceGroups.all[0];
  const fallbackExperienceKey = recommendedExperience?.value ?? "body_scan";
  const rememberedKeyIsValid = experienceGroups.all.some(
    (option) => option.value === rememberedExperienceKey,
  );

  const [experienceKey, setExperienceKey] = useState<SleepExperienceKey>(
    (rememberedKeyIsValid ? (rememberedExperienceKey as SleepExperienceKey) : undefined) ??
      fallbackExperienceKey,
  );
  const [length, setLength] = useState(rememberedLength ?? defaultLength);
  const [view, setView] = useState<"config" | "active" | "complete">("config");
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Number(rememberedLength ?? defaultLength) * 60);
  const [lastSession, setLastSession] = useState<PersistedSleepSessionState | null>(initialLastSession);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "local-only">("idle");
  const [voiceState, setVoiceState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const spokenPhaseRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrlsRef = useRef<string[]>([]);
  const renderedAudioSegmentsRef = useRef<RenderedAudioSegment[]>([]);

  const selectedExperience =
    experienceGroups.all.find((option) => option.value === experienceKey) ?? recommendedExperience;
  const totalSeconds = Math.max(60, Number(length) * 60);

  const sessionContent = useMemo(
    () => buildSessionContent(selectedExperience, totalSeconds),
    [selectedExperience, totalSeconds],
  );
  const voiceGuidanceEnabled = sessionContent.voiceEnabled;
  const progressPercent = Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100);
  const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds);
  const currentPromptIndex = getCurrentPromptIndex(sessionContent.prompts, elapsedSeconds);
  const currentPrompt =
    sessionContent.prompts[currentPromptIndex]?.text ?? sessionContent.prompts[0]?.text ?? "";
  const currentPromptPurpose =
    sessionContent.prompts[currentPromptIndex]?.purpose ?? sessionContent.prompts[0]?.purpose ?? "";

  const clearRenderedAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.removeAttribute("src");
      audioElementRef.current.load();
    }

    audioObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    audioObjectUrlsRef.current = [];
    renderedAudioSegmentsRef.current = [];
    spokenPhaseRef.current = null;
  }, []);

  const requestRenderedAudio = useCallback(async (
    prompts: SessionGuidanceSegment[],
    voiceDirection?: DailyVoiceDirection,
  ) => {
    if (typeof window === "undefined") {
      return;
    }

    setVoiceState("loading");
    setVoiceError(null);

    try {
      const response = await fetch("/api/audio/sleep-guidance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          segments: prompts.map((prompt) => ({
            id: prompt.id,
            text: prompt.text,
            durationSeconds: prompt.durationSeconds,
          })),
          voiceDirection,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.segments?.length) {
        throw new Error(payload?.error || "tts_failed");
      }

      audioObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      audioObjectUrlsRef.current = [];

      renderedAudioSegmentsRef.current = payload.segments.map(
        (segment: { id: string; durationSeconds: number; audioBase64: string }) => {
          const audioUrl = base64ToBlobUrl(segment.audioBase64, payload.mimeType || "audio/mpeg");
          audioObjectUrlsRef.current.push(audioUrl);

          return {
            id: segment.id,
            durationSeconds: segment.durationSeconds,
            audioUrl,
          };
        },
      );

      setVoiceState("ready");
    } catch {
      renderedAudioSegmentsRef.current = [];
      setVoiceState("error");
      setVoiceError("Voice guidance could not load yet. You can still continue without audio.");
    }
  }, []);

  const playRenderedSegment = useCallback(async (index: number) => {
    if (typeof window === "undefined") {
      return;
    }

    const segment = renderedAudioSegmentsRef.current[index];

    if (!segment) {
      return;
    }

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.preload = "auto";
    }

    const audio = audioElementRef.current;
    const shouldRestart = spokenPhaseRef.current !== index || audio.src !== segment.audioUrl;

    if (shouldRestart) {
      audio.pause();
      audio.src = segment.audioUrl;
      audio.currentTime = 0;
      spokenPhaseRef.current = index;
    }

    try {
      await audio.play();
      setVoiceError(null);
    } catch {
      setVoiceState("error");
      setVoiceError("Voice guidance could not play on this device yet.");
    }
  }, []);

  const handleComplete = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const record: PersistedSleepSessionState = {
      dateKey,
      dateLabel,
      focus: selectedExperience.value,
      focusLabel: selectedExperience.title,
      sound: selectedExperience.kind,
      soundLabel: selectedExperience.kindLabel,
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
        speechEnabled: voiceGuidanceEnabled && voiceState === "ready",
      });

      setSaveState(result.ok ? "saved" : "local-only");
    });
  }, [dateKey, dateLabel, length, selectedExperience, startTransition, startedAt, voiceGuidanceEnabled, voiceState]);

  useEffect(() => {
    if (view !== "active" || isPaused || voiceState === "loading") {
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
  }, [handleComplete, isPaused, view, voiceState]);

  useEffect(() => {
    if (view !== "active" || !voiceGuidanceEnabled || voiceState !== "ready" || isPaused) {
      return;
    }

    void playRenderedSegment(currentPromptIndex);
  }, [currentPromptIndex, isPaused, playRenderedSegment, view, voiceGuidanceEnabled, voiceState]);

  useEffect(() => {
    if (view !== "active" || !voiceGuidanceEnabled) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      return;
    }

    void requestRenderedAudio(sessionContent.prompts, sessionContent.voiceDirection);
  }, [requestRenderedAudio, sessionContent.prompts, sessionContent.voiceDirection, view, voiceGuidanceEnabled]);

  useEffect(() => clearRenderedAudio, [clearRenderedAudio]);

  function beginSession(nextExperienceKey: SleepExperienceKey, nextLength: string) {
    const nextExperience =
      experienceGroups.all.find((option) => option.value === nextExperienceKey) ?? recommendedExperience;
    const nextContent = buildSessionContent(nextExperience, Math.max(60, Number(nextLength) * 60));

    clearRenderedAudio();
    setVoiceError(null);
    setVoiceState(nextContent.voiceEnabled ? "loading" : "idle");
    setExperienceKey(nextExperienceKey);
    setStartedAt(new Date().toISOString());
    setSaveState("idle");
    setRemainingSeconds(Math.max(60, Number(nextLength) * 60));
    setLength(nextLength);
    setIsPaused(false);
    setView("active");
  }

  function handleStartCustom(event: React.FormEvent) {
    event.preventDefault();
    beginSession(experienceKey, length);
  }

  function handlePauseToggle() {
    if (view !== "active") {
      return;
    }

    if (isPaused) {
      setIsPaused(false);
      return;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    setIsPaused(true);
  }

  function handleReset() {
    const fallbackKey =
      lastSession && experienceGroups.all.some((option) => option.value === lastSession.focus)
        ? (lastSession.focus as SleepExperienceKey)
        : fallbackExperienceKey;

    clearRenderedAudio();
    setStartedAt(null);
    setSaveState("idle");
    setVoiceState("idle");
    setVoiceError(null);
    setView("config");
    setExperienceKey(fallbackKey);
    setLength(String(lastSession?.lengthMinutes ?? rememberedLength ?? defaultLength));
    setRemainingSeconds(
      Math.max(60, Number(lastSession?.lengthMinutes ?? rememberedLength ?? defaultLength) * 60),
    );
    setIsPaused(false);
  }

  return (
    <div className="space-y-4">
      {view === "config" ? (
        <div className="space-y-4 rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-200">
          <form onSubmit={handleStartCustom} className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium text-stone-100">Sleep Experience</p>
              <select
                value={experienceKey}
                onChange={(event) => setExperienceKey(event.target.value as SleepExperienceKey)}
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-3 py-2 text-sm text-stone-100 outline-none ring-0 focus:border-emerald-400/60"
              >
                <optgroup label="Meditations">
                  {experienceGroups.meditations.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Stories">
                  {experienceGroups.stories.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Soundscapes">
                  {experienceGroups.soundscapes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-stone-100">Time</p>
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

            <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-300">
              <p className="font-medium text-stone-100">{selectedExperience.kindLabel}</p>
              <p className="mt-2">{selectedExperience.summary}</p>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-emerald-400 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Start this experience
            </button>
          </form>
        </div>
      ) : null}

      {view === "active" ? (
        <div className="space-y-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Tonight&apos;s session</p>
            <h3 className="text-xl font-semibold text-stone-50">{sessionContent.title}</h3>
            <p className="text-sm text-stone-300">
              {sessionContent.kindLabel} · {length} minutes
              {voiceGuidanceEnabled
                ? voiceState === "loading"
                  ? " · preparing voice"
                  : voiceState === "error"
                    ? " · voice unavailable"
                    : " · voice guidance on"
                : " · soundscape only"}
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
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
              {voiceGuidanceEnabled ? "Current guidance" : "Current experience"}
            </p>
            {currentPromptPurpose ? (
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">{currentPromptPurpose}</p>
            ) : null}
            <p className="mt-3 text-base leading-7 text-stone-100 sm:text-lg sm:leading-8">{currentPrompt}</p>
          </div>

          {voiceState === "loading" ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              Preparing tonight’s voice guidance...
            </div>
          ) : null}

          {voiceError ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              {voiceError} Keep the page in the foreground and try starting the session again.
            </div>
          ) : null}

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={handlePauseToggle}
              disabled={voiceState === "loading"}
              className="w-full rounded-full border border-stone-700 px-4 py-3 text-sm font-medium text-stone-100 transition hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {voiceState === "loading" ? "Preparing..." : isPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={handleComplete}
              className="w-full rounded-full bg-emerald-400 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-emerald-300 sm:w-auto"
            >
              Complete session
            </button>
          </div>

          <p className="text-xs text-stone-400">{sessionContent.restingNote}</p>
        </div>
      ) : null}

      {view === "complete" ? (
        <div className="space-y-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Session complete</p>
            <h3 className="text-xl font-semibold text-stone-50">You&apos;re done for tonight.</h3>
            <p className="text-sm text-stone-300">Come back tomorrow night for a fresh experience.</p>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 text-sm text-stone-300">
            Completed {selectedExperience.title} · {selectedExperience.kindLabel} · {length} minutes on {dateLabel}.
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
              Start another experience
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
