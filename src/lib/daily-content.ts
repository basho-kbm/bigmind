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

export type DailySpokenTrack = {
  id: string;
  title: string;
  focus: SleepFocusKey;
  durationMinutes: number;
  summary: string;
  openingLine: string;
  structure: string[];
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
  moodTags?: string[];
  primaryTeachingAngle?: string;
  intention?: string;
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
      "return to breath and soundscape as the teaching fades",
    ],
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
      "let sound carry the session toward sleep",
    ],
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
      "settle into breath and sound without effort",
    ],
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
      "fade back into breath and soundscape",
    ],
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

  return {
    id: `spoken-${focus}-${row.date_key}`,
    title: row.title,
    focus,
    durationMinutes: row.duration_minutes ?? defaultDurations[focus],
    summary: row.summary,
    openingLine: row.opening_line,
    structure: toStringArray(row.structure, fallbackSpokenTracks[focus].structure).slice(0, 4),
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
        "You generate bedtime spoken tracks for BigMind Sleep.",
        "The voice is Roshi-bot: 40% Shunryu Suzuki, 40% Alan Watts, 20% Ram Dass.",
        "Do not imitate exact quotes or signature phrases.",
        "The tone must be calm, spacious, beginner-friendly, and sleep-safe.",
        "Avoid lecturing, urgency, spiritual performance, or stimulating abstraction.",
        "Return JSON only.",
      ].join(" "),
      [
        `Generate a wholly new daily spoken track for ${dateKey}.`,
        `Track type: ${focusLabels[focus]}.`,
        `Track brief: ${focusBriefs[focus]}.`,
        `Target default duration: ${defaultDurations[focus]} minutes.`,
        "The output must feel fresh today, not like a light paraphrase of a stock script.",
        "Return valid JSON with exactly these keys:",
        '{"title":"string","summary":"string","openingLine":"string","structure":["string","string","string"],"moodTags":["string"],"primaryTeachingAngle":"string","intention":"string"}',
        "The title should be short and calm.",
        "The summary should be one sentence.",
        "The openingLine should be one bedtime-safe sentence.",
        "The structure array should contain exactly 3 short stage descriptions, each under 16 words.",
      ].join("\n"),
    )) as GeneratedSpokenPayload | null;

    if (!result?.title || !result.summary || !result.openingLine || !Array.isArray(result.structure)) {
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
      primary_angle: result.primaryTeachingAngle ?? null,
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
    roshiBlend: "40% Shunryu Suzuki, 40% Alan Watts, 20% Ram Dass inspiration",
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
