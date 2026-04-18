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
        <h2 className="text-3xl font-semibold tracking-tight">A calmer night starts simply.</h2>
        <p className="max-w-2xl text-stone-300">
          BigMind is designed to help you settle down before sleep with less effort, less pressure,
          and a bedtime practice you can actually keep.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">What to expect</p>
          <h3 className="mt-3 text-xl font-semibold">Sleep comes first</h3>
          <p className="mt-3 text-sm text-stone-300">
            BigMind starts with the clearest win: helping you unwind and drift off more easily.
          </p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">How it feels</p>
          <h3 className="mt-3 text-xl font-semibold">Simple and beginner-friendly</h3>
          <p className="mt-3 text-sm text-stone-300">
            Expect calm guidance, low friction, and no spiritual homework.
          </p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">What happens next</p>
          <h3 className="mt-3 text-xl font-semibold">Start tonight, come back tomorrow</h3>
          <p className="mt-3 text-sm text-stone-300">
            The goal is one helpful nightly session that is easy to return to tomorrow night.
          </p>
        </div>
      </section>

      <div className="rounded-3xl border border-stone-800 bg-stone-900/40 p-6 text-sm text-stone-300">
        Your profile is set up for a calmer, sleep-first experience: beginner guidance <strong>{profile.beginner_focus ? "on" : "off"}</strong> · sleep focus <strong>{profile.sleep_focus ? "on" : "off"}</strong> · setup completed <strong>{profile.onboarding_completed ? "yes" : "not yet"}</strong>
      </div>

      <section className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Next step</p>
        <h3 className="mt-3 text-2xl font-semibold">
          {profile.onboarding_completed ? "You’re ready for tonight’s session." : "Finish setup and go straight into tonight’s session."}
        </h3>
        <p className="mt-3 max-w-2xl text-sm text-stone-300">
          {profile.onboarding_completed
            ? "Your sleep-first defaults are saved. The most important thing now is getting into tonight’s session with as little friction as possible."
            : "This saves your default sleep profile and moves you straight into tonight’s session."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {profile.onboarding_completed ? (
            <Link
              href="/app/today"
              className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Start tonight’s session
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
            Review preferences
          </Link>
        </div>
      </section>
    </div>
  );
}
