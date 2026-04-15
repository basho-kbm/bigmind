import Link from "next/link";

const dashboardCards = [
  {
    title: "Today’s session",
    description: "The critical path is making the nightly sleep session feel real, helpful, and worth returning to tomorrow.",
  },
  {
    title: "Journal",
    description: "Journal is now a later-phase layer. It should come back only after the nightly loop earns trust.",
  },
  {
    title: "Insights",
    description: "Insights come later, after Today is generating real session behavior and return signals.",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Dashboard</p>
        <h2 className="text-3xl font-semibold tracking-tight">BigMind Phase 1 is a free sleep-first loop.</h2>
        <p className="max-w-2xl text-stone-300">
          The job right now is not unlocking billing. It is making one nightly session genuinely
          useful from start to finish, then giving people a reason to come back tomorrow.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/app/orientation"
            className="inline-flex rounded-full border border-stone-700 px-5 py-3 font-medium text-stone-100 transition hover:border-stone-500"
          >
            Start orientation
          </Link>
          <Link
            href="/app/today"
            className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
          >
            Open tonight’s session
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
