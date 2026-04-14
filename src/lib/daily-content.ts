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

const EASTERN_TIME_ZONE = "America/New_York";

const spokenTracks: DailySpokenTrack[] = [
  {
    id: "spoken-body-scan-soft-arrival",
    title: "Soft arrival body scan",
    focus: "body_scan",
    durationMinutes: 20,
    summary: "A gentle scan that moves attention from forehead to feet and keeps the mind from chasing the day.",
    openingLine: "Nothing to solve tonight. Just feel the body being here.",
    structure: [
      "settle with a slower exhale",
      "scan the face, jaw, shoulders, chest, belly, hips, and legs",
      "rest in a steady closing quiet",
    ],
  },
  {
    id: "spoken-open-awareness-night-sky",
    title: "Night sky awareness",
    focus: "open_awareness",
    durationMinutes: 20,
    summary: "A wider, less effortful practice for nights when thoughts keep trying to pull focus outward.",
    openingLine: "Let the mind be as wide as the sky, and let each thought pass like weather.",
    structure: [
      "open attention instead of narrowing it",
      "notice sounds, breath, and sensation without choosing favorites",
      "drift into silence without forcing the ending",
    ],
  },
  {
    id: "spoken-breath-counting-low-friction",
    title: "Low-friction breath counting",
    focus: "breath",
    durationMinutes: 15,
    summary: "A shorter, simpler breath-led session for louder nights when complexity makes sleep harder.",
    openingLine: "If the mind is busy, give it one soft job: follow one breath at a time.",
    structure: [
      "count gentle exhales up to ten",
      "restart without judgment when attention wanders",
      "release the count and let breath continue on its own",
    ],
  },
  {
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
  {
    id: "spoken-zen-impermanence-easing",
    title: "Impermanence and easing",
    focus: "zen_impermanence",
    durationMinutes: 20,
    summary: "A gentle reminder that moods, thoughts, and tension all move when they are not gripped.",
    openingLine: "Even this restless mind is changing, moment by moment.",
    structure: [
      "notice change in breath and sensation",
      "hear a short impermanence teaching",
      "rest with the sense that nothing must be fixed before sleep",
    ],
  },
  {
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
  {
    id: "spoken-zen-beginners-mind-bedtime",
    title: "Beginner’s mind at bedtime",
    focus: "zen_beginner",
    durationMinutes: 15,
    summary: "A simple, approachable Zen entry point that feels beginner-friendly instead of spiritual-performance heavy.",
    openingLine: "Tonight, meet this moment without needing to be good at it.",
    structure: [
      "drop the idea of doing meditation correctly",
      "hear a short beginner’s mind reflection",
      "settle into breath and sound without effort",
    ],
  },
  {
    id: "spoken-zen-story-lantern",
    title: "The lantern story",
    focus: "zen_stories",
    durationMinutes: 20,
    summary: "A short Zen-style bedtime story that shifts the mind out of problem-solving and into listening.",
    openingLine: "A traveler asked for the road at night, and the old teacher lifted a lantern.",
    structure: [
      "listen to a short story told slowly",
      "pause with one simple takeaway",
      "fade back into breath and soundscape",
    ],
  },
];

const soundscapes: DailySoundscape[] = [
  {
    id: "sound-ocean-slow-tide",
    key: "ocean",
    title: "Slow tide",
    description: "Broad, even waves with long gaps and almost no sharp movement.",
    texture: ["low surf", "distant wash", "dark-room stillness"],
  },
  {
    id: "sound-forest-night-air",
    key: "forest",
    title: "Night forest air",
    description: "Soft wind, leaves, and a low steady bed of nighttime forest tone.",
    texture: ["light breeze", "leaf shimmer", "quiet distance"],
  },
  {
    id: "sound-orchestra-warm-hum",
    key: "orchestra",
    title: "Orchestra warm hum",
    description: "A blended, tonal wash inspired by a distant orchestra tuning into stillness.",
    texture: ["warm drones", "soft harmonic bloom", "no melodic pull"],
  },
  {
    id: "sound-jungle-rain-bed",
    key: "jungle",
    title: "Jungle rain bed",
    description: "A darker rain-and-air texture with restrained life in the background.",
    texture: ["low rain", "humid air", "muted night life"],
  },
];

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

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  return Math.abs(hash);
}

export function getDailySleepSession(date = new Date()): DailySleepSession {
  const { dateKey, dateLabel } = getEasternDateParts(date);
  const seed = hashString(dateKey);
  const spokenTrack = spokenTracks[seed % spokenTracks.length];
  const soundscape = soundscapes[(seed * 7) % soundscapes.length];
  const defaultLengthMinutes = spokenTrack.durationMinutes;

  return {
    dateKey,
    dateLabel,
    roshiBlend: "40% Shunryu Suzuki, 40% Alan Watts, 20% Ram Dass inspiration",
    spokenTrack,
    soundscape,
    defaultLengthMinutes,
    recommendationNote:
      defaultLengthMinutes <= 15
        ? "Tonight’s recommendation is intentionally shorter and simpler because lower mental friction usually wins on louder nights."
        : "Tonight’s recommendation keeps a little more guidance up front, then gets out of the way so sleep can happen naturally.",
  };
}
