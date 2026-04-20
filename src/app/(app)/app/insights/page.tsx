import Link from "next/link";

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Patterns</p>
        <h2 className="text-3xl font-semibold tracking-tight">Patterns will show up here soon.</h2>
        <p className="max-w-2xl text-stone-300">
          After a few nights, this is where BigMind can start showing what helps you settle faster.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-stone-700 bg-stone-900/30 p-6 text-sm text-stone-300">
        Tonight still matters more than analytics. Start the session first, then come back here later.
      </div>

      <Link
        href="/app/today"
        className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
      >
        Back to tonight
      </Link>
    </div>
  );
}
