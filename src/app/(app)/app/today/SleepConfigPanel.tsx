'use client';

import { useState } from "react";

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
];

const soundOptions = [
  { value: "ocean", label: "Ocean" },
  { value: "forest", label: "Forest" },
  { value: "orchestra", label: "Orchestra warm-up" },
  { value: "jungle", label: "Jungle" },
];

const lengthOptions = [
  { value: "10", label: "10 minutes" },
  { value: "20", label: "20 minutes (recommended)" },
  { value: "30", label: "30 minutes" },
];

type SleepConfigPanelProps = {
  defaultFocus?: SleepFocusKey;
  defaultSound?: SoundscapeKey;
  defaultLength?: string;
};

export function SleepConfigPanel({
  defaultFocus = "body_scan",
  defaultSound = "ocean",
  defaultLength = "20",
}: SleepConfigPanelProps) {
  const [focus, setFocus] = useState(defaultFocus);
  const [sound, setSound] = useState(defaultSound);
  const [length, setLength] = useState(defaultLength);
  const [status, setStatus] = useState<string | null>(null);

  function handleStart(event: React.FormEvent) {
    event.preventDefault();

    const focusLabel = focusOptions.find((f) => f.value === focus)?.label ?? "Body scan";
    const soundLabel = soundOptions.find((s) => s.value === sound)?.label ?? "Ocean";
    const lengthLabel = lengthOptions.find((l) => l.value === length)?.label ?? "20 minutes";

    setStatus(
      `Session started (placeholder): ${focusLabel} with ${soundLabel.toLowerCase()} for ${lengthLabel}.`
    );

    // TODO: wire this into the real audio player + tracking.
    console.log("BigMind Sleep session config", { focus, sound, length });
  }

  return (
    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Customize tonight</p>

      <form onSubmit={handleStart} className="mt-4 space-y-4 text-sm text-stone-200">
        <div className="space-y-2">
          <p className="font-medium text-stone-100">Focus</p>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value as SleepFocusKey)}
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
            onChange={(e) => setSound(e.target.value as SoundscapeKey)}
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
            onChange={(e) => setLength(e.target.value)}
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
          className="mt-2 w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-emerald-300"
        >
          Queue tonight&apos;s session (prototype)
        </button>
      </form>

      {status && (
        <div className="mt-4 rounded-2xl border border-stone-800 bg-stone-900/70 p-3 text-xs text-stone-300">
          {status}
        </div>
      )}
    </div>
  );
}
