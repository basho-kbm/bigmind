import Link from "next/link";

export default function JournalPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Journal</p>
        <h2 className="text-3xl font-semibold tracking-tight">Journal comes later.</h2>
        <p className="max-w-2xl text-stone-300">
          For now, the important move is tonight’s session.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-stone-700 bg-stone-900/30 p-6 text-sm text-stone-300">
        We’ll keep this space ready for short sleep notes once the nightly loop is locked in.
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
