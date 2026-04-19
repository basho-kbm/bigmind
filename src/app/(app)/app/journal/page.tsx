export default function JournalPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Journal</p>
        <h2 className="text-3xl font-semibold tracking-tight">A simple sleep note space will live here.</h2>
        <p className="max-w-2xl text-stone-300">
          BigMind is focused on helping tonight’s session feel calm, useful, and easy to
          return to.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-stone-700 bg-stone-900/30 p-6 text-sm text-stone-300">
        Sleep notes can come later. For now, less clutter is part of the product.
      </div>
    </div>
  );
}
