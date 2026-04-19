import Link from "next/link";

import { type ProfileRecord } from "@/lib/billing";

import { CheckoutButton } from "./settings/checkout-button";

export function LockedSleepPaywall({ profile }: { profile?: ProfileRecord | null }) {
  const sleepFocus = profile?.sleep_focus ?? true;

  return (
    <div className="space-y-6">
      <div className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
        BigMind Sleep Access
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Fall asleep with more calm, less mental noise.
        </h2>
        <p className="max-w-2xl text-stone-300">
          BigMind Sleep is built around sleep-first support for beginners. Subscribe to unlock the
          nightly meditation flow, sleep-focused guidance, and a daily practice you can actually return to.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">What unlocks</p>
          <ul className="mt-4 space-y-3 text-sm text-stone-200">
            <li>• Sleep-first daily meditation</li>
            <li>• Beginner-friendly calming guidance</li>
            <li>• Journal prompts built for nighttime mental reset</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Why now</p>
          <p className="mt-4 text-sm text-stone-300">
            The fastest path to value is a simple bedtime ritual you can actually return to. That is
            the product we are unlocking first.
          </p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Positioning</p>
          <p className="mt-4 text-sm text-stone-300">
            {sleepFocus
              ? "Your account is already aligned to sleep-focused support. Subscribe to unlock the full experience."
              : "BigMind starts with sleep support first, then expands into a broader calm practice journey."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <CheckoutButton />
        <Link
          href="/app/settings"
          className="rounded-full border border-stone-700 px-5 py-3 font-medium text-stone-100 transition hover:border-stone-500"
        >
          View billing details
        </Link>
      </div>
    </div>
  );
}
