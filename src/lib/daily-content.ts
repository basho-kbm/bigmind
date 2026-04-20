import { getServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SleepFocusKey =
  | "body_scan"
  | "open_awareness"
  | "breath"
  | "zen_self"
  | "zen_impermanence"
  | "zen_emptiness"
  | "zen_beginner"
  | "zen_stories";

export type SoundscapeKey = "ocean" | "forest" | "orchestra" | "jungle";

export type DailySpokenSection = {
  id: "opening" | "main" | "closing";
  purpose: string;
  approxMinutes: number;
  script: string;
  cues?: string[];
};

export type DailyVoiceDirection = {
  pace: string;
  tone: string;
  emphasis: string;
  pauseStyle: string;
  avoid: string[];
};

export type DailySpokenTrack = {
  id: string;
  title: string;
  focus: SleepFocusKey;
  durationMinutes: number;
  summary: string;
  openingLine: string;
  structure: string[];
  intention?: string;
  teachingAngle?: string;
  moodTags?: string[];
  voiceDirection?: DailyVoiceDirection;
  sections?: DailySpokenSection[];
};

export type DailySoundscape = {
  id: string;
  key: SoundscapeKey;
  title: string;
  description: string;
  texture: string[];
};

export type DailySleepSession = {
  dateKey: string;
  dateLabel: string;
  roshiBlend: string;
  spokenTrack: DailySpokenTrack;
  soundscape: DailySoundscape;
  defaultLengthMinutes: number;
  recommendationNote: string;
};

export type DailySleepLibrary = {
  dateKey: string;
  dateLabel: string;
  spokenTracksByFocus: Record<SleepFocusKey, DailySpokenTrack>;
  soundscapesByKey: Record<SoundscapeKey, DailySoundscape>;
};

type StoredDailyContentRow = {
  date_key: string;
  content_kind: "spoken" | "soundscape";
  content_key: string;
  title: string;
  summary: string | null;
  duration_minutes: number | null;
  opening_line: string | null;
  structure: unknown;
  description: string | null;
  texture: unknown;
  mood_tags: unknown;
  primary_angle: string | null;
  variation_profile: string | null;
  raw_payload: unknown;
  llm_model: string | null;
};

type GeneratedSpokenPayload = {
  title: string;
  summary: string;
  openingLine: string;
  structure: string[];
  intention?: string;
  teachingAngle?: string;
  voiceDirection?: DailyVoiceDirection;
  sections?: DailySpokenSection[];
  moodTags?: string[];
  primaryTeachingAngle?: string;
};

type GeneratedSoundscapePayload = {
  title: string;
  description: string;
  texture: string[];
  moodTags?: string[];
  variationProfile?: string;
  loopBehaviorNotes?: string;
};

const EASTERN_TIME_ZONE = "America/New_York";
const RECOMMENDATION_NOTE_LONG =
  "Tonight’s recommendation keeps a little more guidance up front, then gets out of the way so sleep can happen naturally.";
const RECOMMENDATION_NOTE_SHORT =
  "Tonight’s recommendation is intentionally shorter and simpler because lower mental friction usually wins on louder nights.";

const focusOrder: SleepFocusKey[] = [
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

const focusLabels: Record<SleepFocusKey, string> = {
  body_scan: "Body scan meditation",
  open_awareness: "Open awareness meditation",
  breath: "Breath awareness",
  zen_self: "Exploring the self",
  zen_impermanence: "Exploring impermanence",
  zen_emptiness: "Exploring emptiness",
  zen_beginner: "Understanding beginner’s mind",
  zen_stories: "Zen Buddhist stories",
};

const focusBriefs: Record<SleepFocusKey, string> = {
  body_scan: "Move awareness through the body, reduce tension, and keep philosophy minimal.",
  open_awareness: "Help the user stop fighting thoughts and sensations by widening awareness gently.",
  breath: "Give the mind one simple anchor without turning breath into a task.",
  zen_self: "Loosen identification with the restless mind using warm, beginner-friendly language.",
  zen_impermanence: "Soften nighttime gripping by reminding the listener that wakefulness and tension move.",
  zen_emptiness: "Reduce rigidity and over-importance with spacious, non-academic language.",
  zen_beginner: "Reduce pressure to meditate correctly and make bedtime practice feel fresh and simple.",
  zen_stories: "Offer a short bedtime-safe Zen-style story or reflection that lands softly and ends calmly.",
};

const defaultDurations: Record<SleepFocusKey, number> = {
  body_scan: 20,
  open_awareness: 20,
  breath: 15,
  zen_self: 20,
  zen_impermanence: 20,
  zen_emptiness: 20,
  zen_beginner: 15,
  zen_stories: 20,
};

const soundscapeLabels: Record<SoundscapeKey, string> = {
  ocean: "Ocean sounds",
  forest: "Forest sounds",
  orchestra: "Orchestra warm-up sounds",
  jungle: "Jungle sounds",
};

const soundscapeBriefs: Record<SoundscapeKey, string> = {
  ocean: "Keep waves, openness, rolling cadence, and soft spaciousness. Vary tide rhythm, shore distance, wind level, and tonal warmth.",
  forest: "Keep leaves, light night air, distant life, and grounded stillness. Vary breeze, insect density, and canopy depth.",
  orchestra: "Keep soft orchestral tuning, warm resonance, and contemplative human atmosphere. Vary instrument blend and harmonic bloom.",
  jungle: "Keep lush nighttime depth and immersive but non-threatening environmental texture. Vary insect bed, water presence, and humid density.",
};

function normalizeCueText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitScriptIntoCueParts(script: string) {
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

function buildSectionCues(script: string, approxMinutes: number) {
  const parts = splitScriptIntoCueParts(script);

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

function withDerivedSectionCues(section: Omit<DailySpokenSection, "cues">): DailySpokenSection {
  return {
    ...section,
    cues: buildSectionCues(section.script, section.approxMinutes),
  };
}

function buildFallbackSections(focus: SleepFocusKey): DailySpokenSection[] {
  switch (focus) {
    case "body_scan":
      return [
        withDerivedSectionCues({
          id: "opening",
          purpose: "help the listener arrive in the body without effort",
          approxMinutes: 4,
          script:
            "Let the bed hold your weight for a moment. You do not need to do this perfectly. Just notice the places where the body is already touching something solid. Notice the forehead. Notice the jaw. Notice the shoulders. Let the first small change be simple. A little less holding. A little less effort.",
        }),
        withDerivedSectionCues({
          id: "main",
          purpose: "move softly through the body and reduce tension",
          approxMinutes: 12,
          script:
            "Now let attention travel slowly down through the body. The face can soften. The throat can soften. The chest can stop preparing for tomorrow. Let the hands be heavy. Let the belly be unguarded. Let the hips drop down. Let the legs give their weight to the mattress. If the mind wanders, that is all right. Just come back to the next part of the body and let it unclench a little more.",
        }),
        withDerivedSectionCues({
          id: "closing",
          purpose: "fade out of guidance and let sleep come on its own",
          approxMinutes: 4,
          script:
            "You do not need to finish the scan. You only need to be a little less busy than before. Let the whole body rest at once now. If sleep comes, let it come. If you are still awake, let resting be enough for this moment. Nothing is being asked of you now.",
        }),
      ];
    case "open_awareness":
      return [
        withDerivedSectionCues({
          id: "opening",
          purpose: "open the field of attention gently",
          approxMinutes: 4,
          script:
            "Instead of narrowing down, let awareness open a little wider tonight. Breath can be here. Sound can be here. The feeling of the room can be here. Thoughts can pass through without becoming the whole night. You do not need to push anything out.",
        }),
        withDerivedSectionCues({
          id: "main",
          purpose: "let thoughts and sensations move inside a wider field",
          approxMinutes: 12,
          script:
            "Notice how experience keeps changing on its own. A sound appears, then fades. A thought appears, then changes shape. A feeling in the body shifts a little. Let all of it move in a larger space. There is no need to chase the pleasant things or correct the restless ones. Tonight the practice is allowing. Let the mind be wide enough that each thought can come and go without argument.",
        }),
        withDerivedSectionCues({
          id: "closing",
          purpose: "soften into simple awareness without analysis",
          approxMinutes: 4,
          script:
            "Now make the practice even simpler. Let everything be received a little more loosely. Breath, sound, body, thought, space. Nothing to solve. Nothing to hold together. Let awareness stay open until even the effort to stay open begins to fade.",
        }),
      ];
    case "breath":
      return [
        withDerivedSectionCues({
          id: "opening",
          purpose: "give the mind one easy returning place",
          approxMinutes: 3,
          script:
            "If the mind is busy tonight, give it one soft place to return. Not a task. Not a performance. Just this breath, arriving and leaving by itself. Let the exhale do a little more of the calming work.",
        }),
        withDerivedSectionCues({
          id: "main",
          purpose: "settle into natural breath without turning it into work",
          approxMinutes: 9,
          script:
            "Stay close to the breath in the easiest possible way. Feel one inhale. Feel one exhale. If you like, count a few exhales softly, then let the counting go. When attention drifts, return without commentary. The breath does not need to be deeper. It does not need to be cleaner. Let natural breathing be enough to gather the mind back into one place.",
        }),
        withDerivedSectionCues({
          id: "closing",
          purpose: "let the breath keep going without supervision",
          approxMinutes: 3,
          script:
            "Now release even the small effort of following closely. The breath can continue on its own. You can rest beside it. Let breathing happen the way sleep happens, without management.",
        }),
      ];
    case "zen_self":
      return [
        withDerivedSectionCues({
          id: "opening",
          purpose: "reduce identification with the day before sleep",
          approxMinutes: 4,
          script:
            "Tonight you do not need to carry your whole identity into bed with you. The role you played today can rest. The problems can rest. Even the version of you that has been trying to hold everything together can loosen a little now.",
        }),
        withDerivedSectionCues({
          id: "main",
          purpose: "help the listener feel less fused with self-story",
          approxMinutes: 12,
          script:
            "Thoughts about yourself may still appear. Let them. But see if they can be just thoughts for a while, not commands and not definitions. A memory can pass through. A worry can pass through. A plan can pass through. You do not have to disappear. You only have to stop gripping the story so tightly. Under all the narration, there is still breathing, stillness, and the simple fact of being here.",
        }),
        withDerivedSectionCues({
          id: "closing",
          purpose: "rest in being rather than in explanation",
          approxMinutes: 4,
          script:
            "Let the need to explain yourself grow quieter. Let the body lie here without a title. Let the mind be unfinished. Sleep does not require a finished self. Rest can begin before understanding does.",
        }),
      ];
    case "zen_impermanence":
      return [
        withDerivedSectionCues({
          id: "opening",
          purpose: "use change to soften nighttime gripping",
          approxMinutes: 4,
          script:
            "Even this night is moving. Even this mood is moving. The breath changes. Sensation changes. The quality of thought changes. You do not have to force change. Just notice that it is already happening.",
        }),
        withDerivedSectionCues({
          id: "main",
          purpose: "show that wakefulness and tension are not fixed states",
          approxMinutes: 12,
          script:
            "Notice one breath beginning, turning, ending. Notice one sound appearing, then leaving. Notice how tension comes in waves instead of staying exactly the same. Restlessness also changes shape. The mind likes to say this is how the whole night will be. But the night is already moving. Stay close to that simple truth. Not to convince yourself. Just to stop gripping the moment as if it were permanent.",
        }),
        withDerivedSectionCues({
          id: "closing",
          purpose: "let the listener soften into the changing night",
          approxMinutes: 4,
          script:
            "Let the changing night carry you now. You do not need to know what the next minute will feel like. It will not be this exact minute. Let that be enough. Let change do some of the easing for you.",
        }),
      ];
    case "zen_emptiness":
      return [
        withDerivedSectionCues({
          id: "opening",
          purpose: "create more room around thoughts and feelings",
          approxMinutes: 4,
          script:
            "Tonight, make a little more room around everything. Around the breath. Around the body. Around each thought. Nothing has to disappear. It only has to stop feeling so solid and absolute.",
        }),
        withDerivedSectionCues({
          id: "main",
          purpose: "translate emptiness into spaciousness rather than philosophy",
          approxMinutes: 12,
          script:
            "When a thought arrives, notice how quickly the mind wants to make it heavy. See if it can stay lighter than that. When a feeling appears, see if there is a little space around it. The self that feels pressured. The problem that feels enormous. The restlessness that feels central. Give each one a little more room. Not by denying it, but by refusing to make it the whole field.",
        }),
        withDerivedSectionCues({
          id: "closing",
          purpose: "end in looseness and less fixation",
          approxMinutes: 4,
          script:
            "Let the night grow wider than the things you have been holding. Let each thought be less solid. Let each feeling float in a little more space. Let yourself rest in that roominess now.",
        }),
      ];
    case "zen_beginner":
      return [
        withDerivedSectionCues({
          id: "opening",
          purpose: "remove performance pressure from the first minute",
          approxMinutes: 3,
          script:
            "You do not need to be good at this tonight. You do not need a perfect posture, a perfect breath, or a perfect mind. You only need to begin from where you already are.",
        }),
        withDerivedSectionCues({
          id: "main",
          purpose: "make simplicity feel sufficient and calming",
          approxMinutes: 9,
          script:
            "Let this be simple enough for a tired person. Feel the body where it touches the bed. Feel one breath. Hear one sound. That is already enough material for meditation tonight. If the mind says you should be doing more, notice that voice and let it pass. Beginner's mind is not ignorance. It is the willingness to stop performing and meet this moment directly.",
        }),
        withDerivedSectionCues({
          id: "closing",
          purpose: "let the listener drift without self-judgment",
          approxMinutes: 3,
          script:
            "Now let the practice become even smaller. Less ambition. Less checking. Less self-judgment. If sleep comes, good. If not, this softer way of being here is already enough for tonight.",
        }),
      ];
    case "zen_stories":
      return [
        withDerivedSectionCues({
          id: "opening",
          purpose: "offer a simple bedtime story frame",
          approxMinutes: 4,
          script:
            "A traveler came at dusk and asked an old teacher how much farther the road went. The teacher lifted a lantern, set it on the ground between them, and said, walk as far as this light reaches, then carry the lantern forward. That is enough for one night.",
        }),
        withDerivedSectionCues({
          id: "main",
          purpose: "draw one gentle bedtime teaching from the story",
          approxMinutes: 12,
          script:
            "The mind wants the whole road lit before it can rest. But tonight you do not need the whole road. You only need this breath. This patch of bed beneath you. This little bit of quiet you can feel right now. Let the story be small. Let the lesson be small. A night does not have to be solved all at once. Peace can arrive one lantern-length at a time.",
        }),
        withDerivedSectionCues({
          id: "closing",
          purpose: "fade the story into body, breath, and sleep",
          approxMinutes: 4,
          script:
            "Now put the lantern down. Feel the body here. Feel the breath here. Let the story drift into the background. Nothing more to figure out. Just this little circle of rest, and then whatever sleep wants to do next.",
        }),
      ];
  }
}

const fallbackSpokenTracks: Record<SleepFocusKey, DailySpokenTrack> = {
  body_scan: {
    id: "spoken-body-scan-soft-arrival",
    title: "Soft arrival body scan",
    focus: "body_scan",
    durationMinutes: 20,
    summary:
      "A gentle scan that moves attention from forehead to feet and keeps the mind from chasing the day.",
    openingLine: "Nothing to solve tonight. Just feel the body being here.",
    structure: [
      "settle with a slower exhale",
      "scan the face, jaw, shoulders, chest, belly, hips, and legs",
      "rest in a steady closing quiet",
    ],
    sections: buildFallbackSections("body_scan"),
  },
  open_awareness: {
    id: "spoken-open-awareness-night-sky",
    title: "Night sky awareness",
    focus: "open_awareness",
    durationMinutes: 20,
    summary:
      "A wider, less effortful practice for nights when thoughts keep trying to pull focus outward.",
    openingLine: "Let the mind be as wide as the sky, and let each thought pass like weather.",
    structure: [
      "open attention instead of narrowing it",
      "notice sounds, breath, and sensation without choosing favorites",
      "drift into silence without forcing the ending",
    ],
    sections: buildFallbackSections("open_awareness"),
  },
  breath: {
    id: "spoken-breath-counting-low-friction",
    title: "Low-friction breath counting",
    focus: "breath",
    durationMinutes: 15,
    summary:
      "A shorter, simpler breath-led session for louder nights when complexity makes sleep harder.",
    openingLine: "If the mind is busy, give it one soft job: follow one breath at a time.",
    structure: [
      "count gentle exhales up to ten",
      "restart without judgment when attention wanders",
      "release the count and let breath continue on its own",
    ],
    sections: buildFallbackSections("breath"),
  },
  zen_self: {
    id: "spoken-zen-self-lightly-held",
    title: "Self, lightly held",
    focus: "zen_self",
    durationMinutes: 20,
    summary: "A sleep-friendly Zen reflection that loosens self-pressure before bed.",
    openingLine: "You do not need to carry your whole identity into sleep tonight.",
    structure: [
      "settle the body first",
      "hear a short reflection on the softening of self-story",
      "let the teaching fade into quiet",
    ],
    sections: buildFallbackSections("zen_self"),
  },
  zen_impermanence: {
    id: "spoken-zen-impermanence-easing",
    title: "Impermanence and easing",
    focus: "zen_impermanence",
    durationMinutes: 20,
    summary:
      "A gentle reminder that moods, thoughts, and tension all move when they are not gripped.",
    openingLine: "Even this restless mind is changing, moment by moment.",
    structure: [
      "notice change in breath and sensation",
      "hear a short impermanence teaching",
      "rest with the sense that nothing must be fixed before sleep",
    ],
    sections: buildFallbackSections("zen_impermanence"),
  },
  zen_emptiness: {
    id: "spoken-zen-emptiness-roominess",
    title: "Roominess before sleep",
    focus: "zen_emptiness",
    durationMinutes: 20,
    summary: "A spacious, lighter-touch session for nights when inner pressure feels heavy.",
    openingLine: "Make a little more room around every thought and feeling.",
    structure: [
      "relax the body into the bed",
      "hear a short teaching on roominess and non-grasping",
      "let the session drift toward sleep",
    ],
    sections: buildFallbackSections("zen_emptiness"),
  },
  zen_beginner: {
    id: "spoken-zen-beginners-mind-bedtime",
    title: "Beginner’s mind at bedtime",
    focus: "zen_beginner",
    durationMinutes: 15,
    summary:
      "A simple, approachable Zen entry point that feels beginner-friendly instead of spiritual-performance heavy.",
    openingLine: "Tonight, meet this moment without needing to be good at it.",
    structure: [
      "drop the idea of doing meditation correctly",
      "hear a short beginner’s mind reflection",
      "settle into stillness without effort",
    ],
    sections: buildFallbackSections("zen_beginner"),
  },
  zen_stories: {
    id: "spoken-zen-story-lantern",
    title: "The lantern story",
    focus: "zen_stories",
    durationMinutes: 20,
    summary:
      "A short Zen-style bedtime story that shifts the mind out of problem-solving and into listening.",
    openingLine: "A traveler asked for the road at night, and the old teacher lifted a lantern.",
    structure: [
      "listen to a short story told slowly",
      "pause with one simple takeaway",
      "fade back into quiet",
    ],
    sections: buildFallbackSections("zen_stories"),
  },
};

const fallbackSoundscapes: Record<SoundscapeKey, DailySoundscape> = {
  ocean: {
    id: "sound-ocean-slow-tide",
    key: "ocean",
    title: "Slow tide",
    description: "Broad, even waves with long gaps and almost no sharp movement.",
    texture: ["low surf", "distant wash", "dark-room stillness"],
  },
  forest: {
    id: "sound-forest-night-air",
    key: "forest",
    title: "Night forest air",
    description: "Soft wind, leaves, and a low steady bed of nighttime forest tone.",
    texture: ["light breeze", "leaf shimmer", "quiet distance"],
  },
  orchestra: {
    id: "sound-orchestra-warm-hum",
    key: "orchestra",
    title: "Orchestra warm hum",
    description:
      "A blended, tonal wash inspired by a distant orchestra tuning into stillness.",
    texture: ["warm drones", "soft harmonic bloom", "no melodic pull"],
  },
  jungle: {
    id: "sound-jungle-rain-bed",
    key: "jungle",
    title: "Jungle rain bed",
    description: "A darker rain-and-air texture with restrained life in the background.",
    texture: ["low rain", "humid air", "muted night life"],
  },
};

function getEasternDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const keyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return {
    dateKey: keyFormatter.format(date),
    dateLabel: formatter.format(date),
  };
}

function getDayIndex(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const currentUtc = Date.UTC(year, month - 1, day);
  const anchorUtc = Date.UTC(2026, 0, 1);
  return Math.floor((currentUtc - anchorUtc) / (24 * 60 * 60 * 1000));
}

function getRecommendedFocusKey(dateKey: string) {
  return focusOrder[((getDayIndex(dateKey) % focusOrder.length) + focusOrder.length) % focusOrder.length];
}

function getRecommendedSoundscapeKey(dateKey: string) {
  return soundscapeOrder[((getDayIndex(dateKey) * 3) % soundscapeOrder.length + soundscapeOrder.length) % soundscapeOrder.length];
}

function toStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toVoiceDirection(value: unknown): DailyVoiceDirection | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.pace !== "string" ||
    typeof candidate.tone !== "string" ||
    typeof candidate.emphasis !== "string" ||
    typeof candidate.pauseStyle !== "string"
  ) {
    return undefined;
  }

  return {
    pace: candidate.pace,
    tone: candidate.tone,
    emphasis: candidate.emphasis,
    pauseStyle: candidate.pauseStyle,
    avoid: toStringArray(candidate.avoid, []),
  };
}

function toSpokenSections(
  value: unknown,
  fallback: DailySpokenSection[],
): DailySpokenSection[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const sections = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const id = candidate.id;

      if (
        (id !== "opening" && id !== "main" && id !== "closing") ||
        typeof candidate.purpose !== "string" ||
        typeof candidate.script !== "string"
      ) {
        return null;
      }

      const approxMinutes =
        typeof candidate.approxMinutes === "number" && candidate.approxMinutes > 0
          ? candidate.approxMinutes
          : fallback.find((section) => section.id === id)?.approxMinutes ?? 4;

      return {
        id,
        purpose: candidate.purpose,
        approxMinutes,
        script: candidate.script,
        cues: toStringArray(candidate.cues, buildSectionCues(candidate.script, approxMinutes)).slice(0, 5),
      } satisfies DailySpokenSection;
    })
    .filter(Boolean) as DailySpokenSection[];

  return sections.length === 3 ? sections : fallback;
}

function mapStoredSpokenTrack(row: StoredDailyContentRow): DailySpokenTrack | null {
  if (row.content_kind !== "spoken") {
    return null;
  }

  const focus = row.content_key as SleepFocusKey;

  if (!focusOrder.includes(focus)) {
    return null;
  }

  if (!row.title || !row.summary || !row.opening_line) {
    return null;
  }

  const payload = row.raw_payload && typeof row.raw_payload === "object"
    ? (row.raw_payload as Record<string, unknown>)
    : null;

  return {
    id: `spoken-${focus}-${row.date_key}`,
    title: row.title,
    focus,
    durationMinutes: row.duration_minutes ?? defaultDurations[focus],
    summary: row.summary,
    openingLine: row.opening_line,
    structure: toStringArray(row.structure, fallbackSpokenTracks[focus].structure).slice(0, 4),
    intention: payload && typeof payload.intention === "string" ? payload.intention : undefined,
    teachingAngle:
      typeof row.primary_angle === "string"
        ? row.primary_angle
        : payload && typeof payload.teachingAngle === "string"
          ? payload.teachingAngle
          : undefined,
    moodTags: payload ? toStringArray(payload.moodTags, []) : undefined,
    voiceDirection: payload ? toVoiceDirection(payload.voiceDirection) : undefined,
    sections: payload
      ? toSpokenSections(payload.sections, fallbackSpokenTracks[focus].sections ?? [])
      : fallbackSpokenTracks[focus].sections,
  };
}

function mapStoredSoundscape(row: StoredDailyContentRow): DailySoundscape | null {
  if (row.content_kind !== "soundscape") {
    return null;
  }

  const key = row.content_key as SoundscapeKey;

  if (!soundscapeOrder.includes(key)) {
    return null;
  }

  if (!row.title || !row.description) {
    return null;
  }

  return {
    id: `sound-${key}-${row.date_key}`,
    key,
    title: row.title,
    description: row.description,
    texture: toStringArray(row.texture, fallbackSoundscapes[key].texture).slice(0, 4),
  };
}

function buildFallbackLibrary(date = new Date()): DailySleepLibrary {
  const { dateKey, dateLabel } = getEasternDateParts(date);

  return {
    dateKey,
    dateLabel,
    spokenTracksByFocus: { ...fallbackSpokenTracks },
    soundscapesByKey: { ...fallbackSoundscapes },
  };
}

async function fetchStoredRows(dateKey: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("daily_sleep_content")
      .select("*")
      .eq("date_key", dateKey);

    if (error) {
      return [] as StoredDailyContentRow[];
    }

    return (data ?? []) as StoredDailyContentRow[];
  } catch {
    return [] as StoredDailyContentRow[];
  }
}

async function upsertStoredRow(row: Record<string, unknown>) {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("daily_sleep_content").upsert(row, {
      onConflict: "date_key,content_kind,content_key",
    });
  } catch {
    // Swallow for launch-safe fallback behavior.
  }
}

async function callOpenAIJson(systemPrompt: string, userPrompt: string) {
  const env = getServerEnv();

  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const openAiModel = env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAiModel,
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  return JSON.parse(content) as Record<string, unknown>;
}

async function generateSpokenTrack(dateKey: string, focus: SleepFocusKey) {
  const openAiModel = getServerEnv().OPENAI_MODEL ?? "gpt-4.1-mini";
  const fallback = fallbackSpokenTracks[focus];

  try {
    const result = (await callOpenAIJson(
      [
        "You are Roshi-bot for BigMind Sleep.",
        "Generate a full-length guided sleep meditation for tonight.",
        "This is bedtime guidance for tired beginners, not generic wellness copy.",
        "Core influence references for internal guidance only: zen meditation, sleep meditation, Alan Watts, Shunryu Suzuki, and Ram Dass.",
        "Do not imitate exact quotes, signature phrases, or recognizable passages.",
        "Do not name the influences in the script.",
        "Keep the voice calm, grounded, unhurried, lightly austere, and about 10 to 15 percent warmer and more intimate than a traditional Zen lecture cadence.",
        "Avoid app-coach cheerfulness, therapy clichés, mystical theater, abstraction, urgency, or anything sleep-activating.",
        "The meditation must be genuinely useful on first listen and end softer than it begins.",
        "Return JSON only.",
      ].join(" "),
      [
        `Generate a wholly new daily spoken track for ${dateKey}.`,
        `Track type: ${focusLabels[focus]}.`,
        `Track brief: ${focusBriefs[focus]}.`,
        `Target default duration: ${defaultDurations[focus]} minutes.`,
        "The output must feel fresh today, not like a light paraphrase of a stock script.",
        "The script must work as a real guided meditation with an opening settle-in, a substantive middle section, and a softer drift-out closing.",
        "Do not refer to soundscapes, layered audio, or combining this experience with another experience.",
        "Return valid JSON with exactly these keys:",
        '{"title":"string","summary":"string","openingLine":"string","structure":["string","string","string"],"intention":"string","teachingAngle":"string","moodTags":["string"],"voiceDirection":{"pace":"string","tone":"string","emphasis":"string","pauseStyle":"string","avoid":["string","string"]},"sections":[{"id":"opening","purpose":"string","approxMinutes":4,"script":"string","cues":["string","string"]},{"id":"main","purpose":"string","approxMinutes":12,"script":"string","cues":["string","string","string"]},{"id":"closing","purpose":"string","approxMinutes":4,"script":"string","cues":["string","string"]}],"freshnessNotes":{"openingDifference":"string","mainDifference":"string","closingDifference":"string"},"safetyChecks":{"sleepSafe":true,"nonImitative":true,"beginnerFriendly":true,"freshVsRecentHistory":true}}',
        "The title should be short and calm.",
        "The summary should be one sentence.",
        "The openingLine should be one bedtime-safe sentence.",
        "The structure array should contain exactly 3 short stage descriptions, each under 16 words.",
        "Each section script should be substantive, sleep-safe, and ready for voice rendering.",
        "Each section must include 2 to 5 short spoken cues that can be delivered one at a time across the session.",
        "Each cue should sound natural aloud, stay sleep-safe, and avoid production jargon.",
      ].join("\n"),
    )) as GeneratedSpokenPayload | null;

    if (
      !result?.title ||
      !result.summary ||
      !result.openingLine ||
      !Array.isArray(result.structure) ||
      !Array.isArray(result.sections)
    ) {
      return fallback;
    }

    const track: DailySpokenTrack = {
      id: `spoken-${focus}-${dateKey}`,
      title: result.title,
      focus,
      durationMinutes: defaultDurations[focus],
      summary: result.summary,
      openingLine: result.openingLine,
      structure: result.structure.filter(Boolean).slice(0, 3),
      intention: result.intention,
      teachingAngle: result.teachingAngle ?? result.primaryTeachingAngle,
      moodTags: result.moodTags ?? [],
      voiceDirection: toVoiceDirection(result.voiceDirection),
      sections: toSpokenSections(result.sections, fallback.sections ?? []),
    };

    await upsertStoredRow({
      date_key: dateKey,
      content_kind: "spoken",
      content_key: focus,
      title: track.title,
      summary: track.summary,
      duration_minutes: track.durationMinutes,
      opening_line: track.openingLine,
      structure: track.structure,
      mood_tags: result.moodTags ?? [],
      primary_angle: result.teachingAngle ?? result.primaryTeachingAngle ?? null,
      raw_payload: result,
      llm_model: openAiModel,
    });

    return track;
  } catch {
    return fallback;
  }
}

async function generateSoundscape(dateKey: string, key: SoundscapeKey) {
  const openAiModel = getServerEnv().OPENAI_MODEL ?? "gpt-4.1-mini";
  const fallback = fallbackSoundscapes[key];

  try {
    const result = (await callOpenAIJson(
      [
        "You generate daily soundscape manifests for BigMind Sleep.",
        "These are not spoken scripts and should not use Roshi-bot.",
        "The goal is subtle novelty, sleep safety, and recognizable family identity.",
        "Avoid spikes, surprise, dramatic remixing, or attention-grabbing rhythm.",
        "Return JSON only.",
      ].join(" "),
      [
        `Generate a fresh daily soundscape manifest for ${dateKey}.`,
        `Soundscape family: ${soundscapeLabels[key]}.`,
        `Family brief: ${soundscapeBriefs[key]}.`,
        "Return valid JSON with exactly these keys:",
        '{"title":"string","description":"string","texture":["string","string","string"],"moodTags":["string"],"variationProfile":"string","loopBehaviorNotes":"string"}',
        "The title should be short and evocative.",
        "The description should be one sentence.",
        "The texture array should contain exactly 3 short texture notes.",
      ].join("\n"),
    )) as GeneratedSoundscapePayload | null;

    if (!result?.title || !result.description || !Array.isArray(result.texture)) {
      return fallback;
    }

    const soundscape: DailySoundscape = {
      id: `sound-${key}-${dateKey}`,
      key,
      title: result.title,
      description: result.description,
      texture: result.texture.filter(Boolean).slice(0, 3),
    };

    await upsertStoredRow({
      date_key: dateKey,
      content_kind: "soundscape",
      content_key: key,
      title: soundscape.title,
      description: soundscape.description,
      texture: soundscape.texture,
      mood_tags: result.moodTags ?? [],
      variation_profile: result.variationProfile ?? null,
      raw_payload: result,
      llm_model: openAiModel,
    });

    return soundscape;
  } catch {
    return fallback;
  }
}

export async function getDailySleepLibrary(date = new Date()): Promise<DailySleepLibrary> {
  const env = getServerEnv();
  const fallbackLibrary = buildFallbackLibrary(date);
  const { dateKey, dateLabel } = fallbackLibrary;
  const storedRows = await fetchStoredRows(dateKey);

  const spokenTracksByFocus = { ...fallbackLibrary.spokenTracksByFocus };
  const soundscapesByKey = { ...fallbackLibrary.soundscapesByKey };

  for (const row of storedRows) {
    const spokenTrack = mapStoredSpokenTrack(row);
    if (spokenTrack) {
      spokenTracksByFocus[spokenTrack.focus] = spokenTrack;
      continue;
    }

    const soundscape = mapStoredSoundscape(row);
    if (soundscape) {
      soundscapesByKey[soundscape.key] = soundscape;
    }
  }

  const missingFocuses = focusOrder.filter(
    (focus) => spokenTracksByFocus[focus].id === fallbackSpokenTracks[focus].id,
  );
  const missingSoundscapes = soundscapeOrder.filter(
    (key) => soundscapesByKey[key].id === fallbackSoundscapes[key].id,
  );

  if (env.OPENAI_API_KEY) {
    const generatedSpokenTracks = await Promise.all(
      missingFocuses.map(async (focus) => [focus, await generateSpokenTrack(dateKey, focus)] as const),
    );

    for (const [focus, track] of generatedSpokenTracks) {
      spokenTracksByFocus[focus] = track;
    }

    const generatedSoundscapes = await Promise.all(
      missingSoundscapes.map(async (key) => [key, await generateSoundscape(dateKey, key)] as const),
    );

    for (const [key, soundscape] of generatedSoundscapes) {
      soundscapesByKey[key] = soundscape;
    }
  }

  return {
    dateKey,
    dateLabel,
    spokenTracksByFocus,
    soundscapesByKey,
  };
}

export function getDailySleepSessionFromLibrary(
  library: DailySleepLibrary,
): DailySleepSession {
  const recommendedFocus = getRecommendedFocusKey(library.dateKey);
  const recommendedSoundscape = getRecommendedSoundscapeKey(library.dateKey);
  const spokenTrack = library.spokenTracksByFocus[recommendedFocus];
  const soundscape = library.soundscapesByKey[recommendedSoundscape];
  const defaultLengthMinutes = spokenTrack.durationMinutes;

  return {
    dateKey: library.dateKey,
    dateLabel: library.dateLabel,
    roshiBlend: "Zen-inspired, beginner-friendly, and calm enough for bedtime",
    spokenTrack,
    soundscape,
    defaultLengthMinutes,
    recommendationNote:
      defaultLengthMinutes <= 15 ? RECOMMENDATION_NOTE_SHORT : RECOMMENDATION_NOTE_LONG,
  };
}

export async function getDailySleepSession(date = new Date()): Promise<DailySleepSession> {
  const library = await getDailySleepLibrary(date);
  return getDailySleepSessionFromLibrary(library);
}
