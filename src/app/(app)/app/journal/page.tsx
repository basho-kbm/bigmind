import { getBillingProfile } from "@/lib/billing";

import { LockedSleepPaywall } from "../locked-sleep-paywall";

export default async function JournalPage() {
  const billing = await getBillingProfile();

  if (!billing?.isSubscribed) {
    return <LockedSleepPaywall profile={billing?.profile} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Journal</p>
        <h2 className="text-3xl font-semibold tracking-tight">Nightly mental unload</h2>
        <p className="max-w-2xl text-stone-300">
          This journal flow is aimed at clearing cognitive residue before sleep, not producing a
          masterpiece.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Prompt 1</p>
          <p className="mt-3 text-base text-stone-100">What is still buzzing in your mind tonight?</p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Prompt 2</p>
          <p className="mt-3 text-base text-stone-100">What can wait until tomorrow without consequence?</p>
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-stone-700 bg-stone-900/30 p-6 text-sm text-stone-300">
        Journal persistence is the next build step. For now this page establishes the sleep-first
        reflection frame the paid product will use.
      </div>
    </div>
  );
}
