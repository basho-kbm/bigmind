import { getBillingProfile } from "@/lib/billing";

const statusTone: Record<string, string> = {
  active: "text-emerald-200",
  trialing: "text-emerald-200",
  past_due: "text-amber-200",
  canceled: "text-rose-200",
  unpaid: "text-rose-200",
  not_started: "text-stone-200",
};

export default async function SettingsPage() {
  const billing = await getBillingProfile();
  const status = billing?.profile?.subscription_status ?? "not_started";

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Settings</p>
        <h2 className="text-3xl font-semibold tracking-tight">Account and phase status</h2>
        <p className="max-w-2xl text-stone-300">
          BigMind Phase 1 is free. Billing infrastructure can stay in the background for now while
          the product focuses on one real nightly sleep session.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Account status</p>
          <p className="mt-4 text-2xl font-semibold text-stone-50">
            {billing?.user?.email ?? "Signed in"}
          </p>
          <p className="mt-3 max-w-xl text-sm text-stone-300">
            Beginner focus: <strong>{billing?.profile?.beginner_focus ? "on" : "off"}</strong> · sleep focus:{" "}
            <strong>{billing?.profile?.sleep_focus ? "on" : "off"}</strong> · onboarding completed:{" "}
            <strong>{billing?.profile?.onboarding_completed ? "yes" : "not yet"}</strong>
          </p>
        </div>

        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Billing state</p>
          <p className={`mt-4 text-2xl font-semibold ${statusTone[status] ?? "text-stone-50"}`}>
            {status.replaceAll("_", " ")}
          </p>
          <p className="mt-3 text-sm text-stone-300">
            This exists for later owned-product monetization. It is not required to use BigMind
            Sleep in Phase 1.
          </p>
        </div>
      </section>
    </div>
  );
}
