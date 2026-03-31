import { getBillingProfile } from "@/lib/billing";

import { CheckoutButton } from "./checkout-button";

const statusTone: Record<string, string> = {
  active: "text-emerald-200",
  trialing: "text-emerald-200",
  past_due: "text-amber-200",
  canceled: "text-rose-200",
  unpaid: "text-rose-200",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const billing = await getBillingProfile();
  const params = (await searchParams) ?? {};
  const checkoutState = typeof params.checkout === "string" ? params.checkout : undefined;
  const status = billing?.profile?.subscription_status ?? "not_started";
  const isSubscribed = billing?.isSubscribed ?? false;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Settings</p>
        <h2 className="text-3xl font-semibold tracking-tight">Account and billing hub</h2>
        <p className="max-w-2xl text-stone-300">
          This is now the paid access control point for BigMind. Subscription state lives here first,
          then flows into the rest of the app.
        </p>
      </section>

      {checkoutState === "success" ? (
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm text-emerald-100">
          Checkout completed. If your access does not unlock within a moment, refresh this page.
        </div>
      ) : null}

      {checkoutState === "cancelled" ? (
        <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-100">
          Checkout was canceled. You can restart whenever you are ready.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Subscription status</p>
          <p className={`mt-4 text-2xl font-semibold ${statusTone[status] ?? "text-stone-50"}`}>
            {status.replaceAll("_", " ")}
          </p>
          <p className="mt-3 max-w-xl text-sm text-stone-300">
            {isSubscribed
              ? "Billing is active. Next step is using this status to unlock the Today experience and the rest of the product."
              : "No active subscription yet. Start checkout to unlock the paid BigMind app."}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Current plan</p>
          <h3 className="mt-4 text-xl font-semibold text-white">BigMind Monthly</h3>
          <p className="mt-2 text-sm text-stone-300">$9.99/month · beginner meditation + sleep support</p>
          <div className="mt-6">
            <CheckoutButton disabled={isSubscribed} />
          </div>
        </div>
      </section>
    </div>
  );
}
