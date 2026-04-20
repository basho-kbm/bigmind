import Link from "next/link";

import { ensureProfile, getBillingProfile } from "@/lib/billing";
import { appConfig } from "@/lib/config";

const howItWorks = [
  {
    title: "Start with the easiest path",
    description:
      "Open tonight’s recommended session right away, or choose a different Sleep Experience and time if you want more control.",
  },
  {
    title: "Settle into calmer guidance",
    description:
      "Follow a bedtime flow that feels gentle, visual, and easy to stay with when you are already tired.",
  },
  {
    title: "Come back tomorrow without friction",
    description:
      "BigMind keeps the return path continuous so the next night feels familiar, not like starting over.",
  },
];

const featureHighlights = [
  {
    emoji: "🌙",
    title: "Sleep meditations",
    description:
      "Short guided sessions built to quiet the mind and help you ease into sleep faster.",
  },
  {
    emoji: "📖",
    title: "Zen stories",
    description:
      "Gentle stories and teachings that soften mental noise without feeling heavy or academic.",
  },
  {
    emoji: "🎧",
    title: "Soundscapes",
    description:
      "Ocean, forest, and other sleep-friendly textures that make the night feel calmer right away.",
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

export default async function MarketingHome() {
  const billing = await getBillingProfile();
  const profile = billing
    ? (billing.profile ??
      (await ensureProfile({
        userId: billing.user.id,
        email: billing.user.email,
        fullName: billing.user.user_metadata?.full_name ?? null,
      })))
    : null;

  const primaryHref = billing
    ? profile?.onboarding_completed
      ? "/app/today"
      : "/app/orientation"
    : "/login";
  const primaryLabel = billing
    ? profile?.onboarding_completed
      ? "Continue tonight"
      : "Finish setup"
    : "Start tonight";
  const secondaryLink = billing
    ? {
        href: "/app/settings",
        label: billing.isSubscribed ? "Subscriber settings" : "Your settings",
      }
    : {
        href: "/login",
        label: "Log in",
      };

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">
              BigMind Sleep
            </div>
            <div className="inline-flex w-fit rounded-full border border-stone-700 bg-stone-900/70 px-3 py-1 text-stone-200">
              {billing ? (billing.isSubscribed ? "Subscriber recognized" : "Welcome back") : "Free to start"}
            </div>
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Fall asleep with sleep meditations, Zen stories, and calming soundscapes.
            </h1>
            <p className="text-lg text-stone-300 sm:text-xl">
              {appConfig.name} helps you start with tonight’s recommendation fast, or choose your
              own Sleep Experience when you want more control.
            </p>
            {billing?.user.email ? (
              <p className="text-sm text-stone-400">Signed in as {billing.user.email}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href={primaryHref}
              className="rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryLink.href}
              className="rounded-full border border-stone-700 px-5 py-3 font-medium text-stone-100 transition hover:border-stone-500"
            >
              {secondaryLink.label}
            </Link>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 text-sm text-stone-300">
            {billing
              ? "Already started? You can pick up tonight’s session in one tap."
              : "Already started? Use the same email to pick up tonight’s session in one tap."}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureHighlights.map((item) => (
            <div key={item.title} className="rounded-3xl border border-stone-800 bg-stone-900/50 p-6">
              <p className="text-2xl">{item.emoji}</p>
              <h2 className="mt-4 text-xl font-medium text-stone-50">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-300">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 rounded-3xl border border-stone-800 bg-stone-900/60 p-8 md:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-medium">A calmer bedtime without more decisions</h2>
            <p className="text-stone-300">
              BigMind Sleep is built for nights when you want one obvious next step, a calmer
              session, and a simple way back tomorrow night.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">What you get tonight</p>
            <ul className="mt-4 space-y-3 text-sm text-stone-200">
              <li>&bull; One recommended session you can start fast</li>
              <li>&bull; Sleep meditations, Zen stories, and soundscapes</li>
              <li>&bull; Simple customization when you want it</li>
              <li>&bull; A smoother return path tomorrow night</li>
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
              Three beginner-friendly guides help new visitors understand the promise quickly and
              move into BigMind Sleep with less friction.
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
