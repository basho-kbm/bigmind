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
          <p className="mt-4 text-2xl font-semibold text-stone-50">{billing.user.email ?? "Signed in"}</p>
          <p className="mt-3 max-w-xl text-sm text-stone-300">
            Beginner focus: <strong>{profile.beginner_focus ? "on" : "off"}</strong> · sleep focus:{" "}
            <strong>{profile.sleep_focus ? "on" : "off"}</strong> · onboarding completed:{" "}
            <strong>{profile.onboarding_completed ? "yes" : "not yet"}</strong>
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

      <section className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Sleep profile</p>
        <h3 className="mt-3 text-2xl font-semibold">Adjust the default experience</h3>
        <p className="mt-3 max-w-2xl text-sm text-stone-300">
          Keep the defaults calm and beginner-friendly, or tune them before tonight’s session.
        </p>

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
              <span className="mt-1 block text-stone-300">
                Keep the experience lighter, simpler, and less spiritually dense.
              </span>
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
              <span className="mt-1 block text-stone-300">
                Prioritize calming sleep sessions over broader meditation exploration.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Save profile settings
            </button>
            <Link
              href={profile.onboarding_completed ? "/app/today" : "/app/orientation"}
              className="inline-flex rounded-full border border-stone-700 px-5 py-3 text-sm font-medium text-stone-100 transition hover:border-stone-500"
            >
              {profile.onboarding_completed ? "Open tonight’s session" : "Finish orientation"}
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
