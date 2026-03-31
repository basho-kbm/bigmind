import Link from "next/link";

import { getBillingProfile } from "@/lib/billing";

const dashboardCards = [
  {
    title: "Today’s meditation",
    description: "Daily guided meditation delivery is the next product loop to make real.",
  },
  {
    title: "Journal",
    description: "Reflection prompts and recent entries will become the retention anchor.",
  },
  {
    title: "Insights",
    description: "Roshi guidance will come after Today + Journal are generating real inputs.",
  },
];

export default async function DashboardPage() {
  const billing = await getBillingProfile();
  const isSubscribed = billing?.isSubscribed ?? false;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Dashboard</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          {isSubscribed ? "Your BigMind subscription is active." : "Your app access is live. Billing is next."}
        </h2>
        <p className="max-w-2xl text-stone-300">
          {isSubscribed
            ? "Now the priority is turning Today into a real daily meditation experience people come back for."
            : "Authentication is in. The next unlock is Stripe checkout and subscription state flowing cleanly through the app."}
        </p>
        {!isSubscribed ? (
          <Link
            href="/app/settings"
            className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
          >
            Finish billing setup
          </Link>
        ) : null}
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
