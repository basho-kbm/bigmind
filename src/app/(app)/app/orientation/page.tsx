import { ensureProfile, getBillingProfile } from "@/lib/billing";

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
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">Current state</p>
          <h3 className="mt-3 text-xl font-semibold">{billing.isSubscribed ? "Unlocked" : "Ready to unlock"}</h3>
          <p className="mt-3 text-sm text-stone-300">
            {billing.isSubscribed
              ? "Your subscription is active, so the next step is using Today as your nightly reset ritual."
              : "Your shell is live. Subscribe to unlock the actual sleep-focused practice surfaces."}
          </p>
        </div>
      </section>

      <div className="rounded-3xl border border-stone-800 bg-stone-900/40 p-6 text-sm text-stone-300">
        Profile defaults applied: beginner focus <strong>{profile.beginner_focus ? "on" : "off"}</strong> · sleep focus <strong>{profile.sleep_focus ? "on" : "off"}</strong>
      </div>
    </div>
  );
}
