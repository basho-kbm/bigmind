export default function JournalPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Journal</p>
        <h2 className="text-3xl font-semibold tracking-tight">Journal returns in a later phase.</h2>
        <p className="max-w-2xl text-stone-300">
          BigMind Phase 1 is about making Tonight’s session genuinely useful. Journal should come
          back only after the nightly loop earns trust and return behavior.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-stone-700 bg-stone-900/30 p-6 text-sm text-stone-300">
        Journal is intentionally out of the Phase 1 critical path. Keeping it lightweight here is a
        choice, not a missing unlock.
      </div>
    </div>
  );
}
