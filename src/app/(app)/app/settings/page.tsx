import Link from "next/link";

import { ensureProfile, getBillingProfile } from "@/lib/billing";

import { saveProfileSettings } from "./actions";

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

  if (!billing) {
    return null;
  }

  const profile = await ensureProfile({
    userId: billing.user.id,
    email: billing.user.email,
    fullName: billing.user.user_metadata?.full_name ?? null,
  });
  const status = profile.subscription_status ?? "not_started";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Preferences</p>
        <h2 className="text-3xl font-semibold tracking-tight">Keep tonight simple.</h2>
        <p className="max-w-2xl text-stone-300">
          These are your defaults. Change them anytime, then head back into tonight’s session.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Account</p>
          <p className="mt-3 text-base font-medium text-stone-50">{billing.user.email ?? "Signed in"}</p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Access</p>
          <p className={`mt-3 text-base font-medium ${statusTone[status] ?? "text-stone-50"}`}>
            {status.replaceAll("_", " ")}
          </p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Tonight</p>
          <p className="mt-3 text-base font-medium text-stone-50">
            {profile.onboarding_completed ? "Ready to start" : "Finish setup first"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Defaults</p>
            <h3 className="mt-3 text-2xl font-semibold">How BigMind should feel by default</h3>
            <p className="mt-3 max-w-2xl text-sm text-stone-300">
              Keep the experience light, sleep-first, and easy to return to.
            </p>
          </div>
          <Link
            href={profile.onboarding_completed ? "/app/today" : "/app/orientation"}
            className="inline-flex rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-stone-500"
          >
            {profile.onboarding_completed ? "Back to tonight" : "Finish setup"}
          </Link>
        </div>

        <form action={saveProfileSettings} className="mt-6 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-100">Display name</span>
            <input
              type="text"
              name="full_name"
              defaultValue={profile.full_name ?? ""}
              placeholder="How BigMind should address you"
              className="w-full rounded-2xl border border-stone-700 bg-stone-950/90 px-4 py-3 text-base text-stone-50 outline-none transition placeholder:text-stone-500 focus:border-emerald-400"
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-200">
            <input
              type="checkbox"
              name="beginner_focus"
              defaultChecked={profile.beginner_focus}
              className="mt-1 h-4 w-4 rounded border-stone-600 bg-stone-950 text-emerald-400"
            />
            <span>
              <strong className="text-stone-50">Beginner-friendly guidance</strong>
              <span className="mt-1 block text-stone-300">Keep the tone lighter and simpler.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-sm text-stone-200">
            <input
              type="checkbox"
              name="sleep_focus"
              defaultChecked={profile.sleep_focus}
              className="mt-1 h-4 w-4 rounded border-stone-600 bg-stone-950 text-emerald-400"
            />
            <span>
              <strong className="text-stone-50">Sleep-first recommendations</strong>
              <span className="mt-1 block text-stone-300">Keep tonight’s best session front and center.</span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Save defaults
            </button>
            <Link
              href={profile.onboarding_completed ? "/app/today" : "/app/orientation"}
              className="inline-flex rounded-full border border-stone-700 px-5 py-3 text-sm font-medium text-stone-100 transition hover:border-stone-500"
            >
              {profile.onboarding_completed ? "Back to tonight" : "Finish setup"}
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
