import { getBillingProfile } from "@/lib/billing";

import { LockedSleepPaywall } from "../locked-sleep-paywall";

export default async function TodayPage() {
  const billing = await getBillingProfile();

  if (!billing?.isSubscribed) {
    return <LockedSleepPaywall profile={billing?.profile} />;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Today</p>
        <h2 className="text-3xl font-semibold tracking-tight">Tonight’s sleep reset</h2>
        <p className="max-w-2xl text-stone-300">
          A simple nightly practice designed to lower mental noise, slow the body down, and make it
          easier to fall asleep without forcing it.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Tonight’s session</p>
          <h3 className="mt-3 text-2xl font-semibold">12-minute unwind meditation</h3>
          <p className="mt-4 text-sm leading-6 text-stone-300">
            Focus on the exhale, release the day in three passes, and stop trying to “win” sleep.
            The goal is softer attention, not perfect performance.
          </p>
          <div className="mt-6 rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-300">
            Roshi note: if your mind feels loud tonight, that is exactly when shorter, simpler
            guidance tends to work best.
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Wind-down structure</p>
            <ul className="mt-4 space-y-3 text-sm text-stone-200">
              <li>• 2 minutes to unclench physically</li>
              <li>• 6 minutes guided breath + body attention</li>
              <li>• 4 minutes letting thoughts pass without engagement</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Completion goal</p>
            <p className="mt-4 text-sm text-stone-300">
              Don’t optimize for intensity. Optimize for showing up tonight and wanting to return
              tomorrow.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
