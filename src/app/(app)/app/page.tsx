const dashboardCards = [
  {
    title: "Today’s meditation",
    description: "Daily guided meditation delivery will land here next.",
  },
  {
    title: "Journal",
    description: "Reflection prompts and recent entries will live here.",
  },
  {
    title: "Insights",
    description: "Roshi-bot guidance based on usage, journal, and course progress.",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Dashboard</p>
        <h2 className="text-3xl font-semibold tracking-tight">The gated app shell is ready.</h2>
        <p className="max-w-2xl text-stone-300">
          Next up: real auth, profile bootstrap, subscription checks, and the first meditation and
          journaling surfaces.
        </p>
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
