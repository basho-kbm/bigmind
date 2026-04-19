import Link from "next/link";

const dashboardCards = [
  {
    title: "Today’s session",
    description:
      "Start tonight’s guided sleep session with calm pacing, simple choices, and a clear path into rest.",
  },
  {
    title: "Journal",
    description:
      "A lightweight reflection space will live here. Tonight, the focus stays on helping you feel calmer.",
  },
  {
    title: "Insights",
    description:
      "As BigMind learns what helps you settle down, this is where your patterns and recommendations will appear.",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">BigMind Sleep</p>
        <h2 className="text-3xl font-semibold tracking-tight">Tonight starts here.</h2>
        <p className="max-w-2xl text-stone-300">
          BigMind is built to help you wind down faster, stay with a calm guided session, and come
          back tomorrow night without friction.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/app/orientation"
            className="inline-flex rounded-full border border-stone-700 px-5 py-3 font-medium text-stone-100 transition hover:border-stone-500"
          >
            See how it works
          </Link>
          <Link
            href="/app/today"
            className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
          >
            Start tonight’s session
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardCards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <h3 className="text-lg font-medium text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-stone-300">{card.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
