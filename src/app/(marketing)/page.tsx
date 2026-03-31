import Link from "next/link";

import { appConfig } from "@/lib/config";

const launchChecklist = [
  "Ship subscription flow with Stripe and gated app routes.",
  "Connect Supabase auth, profile creation, and dashboard data.",
  "Stand up Roshi-bot foundations for daily meditations, journaling, and insights.",
];

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <section className="flex flex-col gap-6">
          <div className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
            BigMind operator launch sprint
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Sleep better with calm, beginner-friendly meditation that actually feels usable.
            </h1>
            <p className="text-lg text-stone-300 sm:text-xl">
              {appConfig.name} helps beginners quiet mental noise at night, build a simple bedtime
              practice, and return to sleep-focused guidance that feels grounded instead of airy.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Enter the app
            </Link>
            <Link
              href="/app"
              className="rounded-full border border-stone-700 px-5 py-3 font-medium text-stone-100 transition hover:border-stone-500"
            >
              View gated shell
            </Link>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-stone-800 bg-stone-900/60 p-8 md:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-medium">Track A foundation is live</h2>
            <p className="text-stone-300">
              Next.js is up, env validation is wired, Supabase and Stripe helpers are in place,
              and this repo is ready for auth, subscription gating, and the first app surfaces.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">v1 goals</p>
            <ul className="mt-4 space-y-3 text-sm text-stone-200">
              <li>• Responsive web app</li>
              <li>• $9.99 monthly subscription</li>
              <li>• Sleep-first meditation + journal + calming guidance</li>
              <li>• Stable enough to sell immediately</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {launchChecklist.map((item, index) => (
            <div key={item} className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6">
              <p className="text-sm text-emerald-200">Step 0{index + 1}</p>
              <p className="mt-3 text-base text-stone-100">{item}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
