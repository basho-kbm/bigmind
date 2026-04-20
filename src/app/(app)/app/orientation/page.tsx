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
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Welcome</p>
        <h2 className="text-3xl font-semibold tracking-tight">You’re almost ready for tonight.</h2>
        <p className="max-w-2xl text-stone-300">
          BigMind keeps the first step simple. Start with one calm sleep session, then adjust the
          details later if you want.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-5">
          <p className="text-2xl">🌙</p>
          <h3 className="mt-3 text-lg font-semibold">Tonight first</h3>
          <p className="mt-2 text-sm text-stone-300">One clear nightly session. No extra homework.</p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-5">
          <p className="text-2xl">⚙️</p>
          <h3 className="mt-3 text-lg font-semibold">Optional control</h3>
          <p className="mt-2 text-sm text-stone-300">Change preferences anytime without slowing down the first run.</p>
        </div>
        <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-5">
          <p className="text-2xl">↩️</p>
          <h3 className="mt-3 text-lg font-semibold">Easy return</h3>
          <p className="mt-2 text-sm text-stone-300">Come back tomorrow without feeling like you are starting over.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-800 bg-stone-900/50 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Current defaults</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-stone-200">
          <span className="rounded-full border border-stone-700 px-3 py-1">
            Beginner guidance: {profile.beginner_focus ? "on" : "off"}
          </span>
          <span className="rounded-full border border-stone-700 px-3 py-1">
            Sleep-first: {profile.sleep_focus ? "on" : "off"}
          </span>
          <span className="rounded-full border border-stone-700 px-3 py-1">
            Setup: {profile.onboarding_completed ? "done" : "not done"}
          </span>
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Next step</p>
        <h3 className="mt-3 text-2xl font-semibold">
          {profile.onboarding_completed ? "Go straight into tonight." : "Save this and start tonight."}
        </h3>
        <p className="mt-3 max-w-2xl text-sm text-stone-300">
          {profile.onboarding_completed
            ? "Your defaults are already saved. The best move now is to start tonight’s session."
            : "This saves your defaults now. You can change them later in Preferences."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {profile.onboarding_completed ? (
            <Link
              href="/app/today"
              className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
            >
              Start tonight
            </Link>
          ) : (
            <form action={completeOrientation}>
              <button
                type="submit"
                className="inline-flex rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300"
              >
                Save and start tonight
              </button>
            </form>
          )}
          <Link
            href="/app/settings"
            className="inline-flex rounded-full border border-stone-700 px-5 py-3 text-sm font-medium text-stone-100 transition hover:border-stone-500"
          >
            Preferences
          </Link>
        </div>
      </section>
    </div>
  );
}
