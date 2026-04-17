import Link from "next/link";

import { appConfig } from "@/lib/config";

const howItWorks = [
  {
    title: "Start with the easiest path",
    description: "Open tonight’s recommended session immediately, or customize the focus, soundscape, and length if you want more control.",
  },
  {
    title: "Settle into calmer guidance",
    description: "Follow a simple bedtime flow designed to lower mental friction instead of giving you one more thing to do right.",
  },
  {
    title: "Make tomorrow night easier",
    description: "BigMind keeps the return path more continuous so the habit can feel alive instead of reset every time.",
  },
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
              href="/sleep-meditation-for-beginners"
              className="rounded-full border border-stone-700 px-5 py-3 font-medium text-stone-100 transition hover:border-stone-500"
            >
              See how BigMind works
            </Link>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-stone-800 bg-stone-900/60 p-8 md:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-medium">A calmer bedtime without adding more pressure</h2>
            <p className="text-stone-300">
              BigMind Sleep is built for nights when you want a simpler way to settle your mind,
              ease into sleep, and come back tomorrow without feeling like you are starting from
              zero again.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">What you get tonight</p>
            <ul className="mt-4 space-y-3 text-sm text-stone-200">
              <li>&bull; One recommended session you can start fast</li>
              <li>&bull; Gentle Zen-inspired guidance for beginners</li>
              <li>&bull; Simple customization when you want it</li>
              <li>&bull; A better return path tomorrow night</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {howItWorks.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6"
            >
              <p className="text-sm text-emerald-200">How it works</p>
              <p className="mt-3 text-base font-medium text-stone-100">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-stone-300">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6 rounded-3xl border border-stone-800 bg-stone-900/40 p-8">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Sleep guides</p>
            <h2 className="text-2xl font-medium">Start with the simplest help first</h2>
            <p className="max-w-3xl text-stone-300">
              Three beginner-friendly guides are now live to help new visitors understand the
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
