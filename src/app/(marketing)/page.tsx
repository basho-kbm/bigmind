import Link from "next/link";

import { appConfig } from "@/lib/config";

const launchChecklist = [
  "Make the free BigMind Sleep session genuinely useful.",
  "Keep signup light: Supabase auth, simple profile, clean entry into Today.",
  "Prepare for Phase 2: email list growth, segmentation, and affiliate readiness.",
];

const sleepGuides = [
  {
    href: "/sleep-meditation-for-beginners",
    title: "Sleep Meditation for Beginners",
    description: "A simple, low-pressure guide for people who want a calmer way to wind down tonight.",
  },
  {
    href: "/body-scan-for-sleep",
    title: "Body Scan for Sleep",
    description: "A gentle guide to using body awareness to release tension and fall asleep faster.",
  },
  {
    href: "/zen-meditation-for-sleep",
    title: "Zen Meditation for Sleep",
    description: "A simpler, Zen-inspired way to calm mental noise at night without adding pressure.",
  },
];

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <section className="flex flex-col gap-6">
          <div className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
            BigMind Sleep 
            
            &middot; Phase 1 free launch
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Fall asleep with a simple, configurable Zen sleep session.
            </h1>
            <p className="text-lg text-stone-300 sm:text-xl">
              {appConfig.name} helps beginners quiet mental noise at night with calm, configurable
              sessions that blend gentle guidance, Zen-inspired teachings, and soothing soundscapes.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Start BigMind Sleep (free)
            </Link>
            <Link
              href="/app"
              className="rounded-full border border-stone-700 px-5 py-3 font-medium text-stone-100 transition hover:border-stone-500"
            >
              View operator shell
            </Link>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-stone-800 bg-stone-900/60 p-8 md:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-medium">Phase 1 foundation is live</h2>
            <p className="text-stone-300">
              Next.js is up, env validation is wired, Supabase auth is in place, and this repo is
              now pointed at a free, sleep-first BigMind experience instead of a paid-first
              subscription launch.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Phase 1 goals</p>
            <ul className="mt-4 space-y-3 text-sm text-stone-200">
              <li>
                
                &bull; Free web app focused on sleep
              </li>
              <li>
                
                &bull; Friction-light signup and entry
              </li>
              <li>
                
                &bull; One genuinely helpful nightly session
              </li>
              <li>
                
                &bull; Clean foundation for email + affiliate Phase 2
              </li>
            </ul>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {launchChecklist.map((item, index) => (
            <div
              key={item}
              className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6"
            >
              <p className="text-sm text-emerald-200">Step 0{index + 1}</p>
              <p className="mt-3 text-base text-stone-100">{item}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6 rounded-3xl border border-stone-800 bg-stone-900/40 p-8">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Sleep guides</p>
            <h2 className="text-2xl font-medium">Start with the simplest help first</h2>
            <p className="max-w-3xl text-stone-300">
              Two beginner-friendly guides are now live to help new visitors understand the
              product promise and move into BigMind Sleep with less friction.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sleepGuides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6 transition hover:border-stone-600"
              >
                <p className="text-lg font-medium text-stone-50">{guide.title}</p>
                <p className="mt-3 text-sm leading-6 text-stone-300">{guide.description}</p>
                <p className="mt-4 text-sm text-emerald-200">Read guide</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
