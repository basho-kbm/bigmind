import Link from "next/link";

import { ensureProfile, getBillingProfile } from "@/lib/billing";

import { completeOrientation } from "./actions";

export default async function OrientationPage() {
  const billing = await getBillingProfile();

  if (!billing) {
    return null;
  }

  const profile = await ensureProfile({
    userId: billing.user.id,
    email: billing.user.email,
    fullName: billing.user.user_metadata?.full_name ?? null,
  });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Orientation</p>
        <h2 className="text-3xl font-semibold tracking-tight">You’re in. Now point the habit at sleep.</h2>
        <p className="max-w-2xl text-stone-300">
          BigMind Phase 1 is designed around better nights, lower mental friction, and a bedtime
          practice that beginners can actually keep.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Primary goal</p>
          <h3 className="mt-3 text-xl font-semibold">Sleep first</h3>
          <p className="mt-3 text-sm text-stone-300">
            We’re leading with sleep because it is the clearest, most immediate transformation path.
          </p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Default profile</p>
          <h3 className="mt-3 text-xl font-semibold">Beginner friendly</h3>
          <p className="mt-3 text-sm text-stone-300">
            New accounts start simple: calm guidance, low friction, no spiritual homework.
          </p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Current phase</p>
          <h3 className="mt-3 text-xl font-semibold">Free nightly loop</h3>
          <p className="mt-3 text-sm text-stone-300">
            The next step is making Tonight’s session feel genuinely useful, then earning a return tomorrow night.
          </p>
        </div>
      </section>

      <div className="rounded-3xl border border-stone-800 bg-stone-900/40 p-6 text-sm text-stone-300">
        Profile defaults applied: beginner focus <strong>{profile.beginner_focus ? "on" : "off"}</strong> · sleep focus <strong>{profile.sleep_focus ? "on" : "off"}</strong> · onboarding completed <strong>{profile.onboarding_completed ? "yes" : "not yet"}</strong>
      </div>

      <section className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Next step</p>
        <h3 className="mt-3 text-2xl font-semibold">
          {profile.onboarding_completed ? "You’re cleared for tonight’s session." : "Complete orientation and go straight into Tonight."}
        </h3>
        <p className="mt-3 max-w-2xl text-sm text-stone-300">
          {profile.onboarding_completed
            ? "Your sleep-first defaults are saved. The most important thing now is starting tonight’s session with as little friction as possible."
            : "This locks in the default beginner-friendly sleep profile and moves you directly into the nightly loop."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {profile.onboarding_completed ? (
            <Link
              href="/app/today"
              className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Open tonight’s session
            </Link>
          ) : (
            <form action={completeOrientation}>
              <button
                type="submit"
                className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
              >
                I’m ready for tonight
              </button>
            </form>
          )}
          <Link
            href="/app/settings"
            className="inline-flex rounded-full border border-stone-700 px-5 py-3 text-sm font-medium text-stone-100 transition hover:border-stone-500"
          >
            Review account settings
          </Link>
        </div>
      </section>
    </div>
  );
}
