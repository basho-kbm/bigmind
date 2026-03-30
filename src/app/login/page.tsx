import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <div className="mx-auto flex max-w-xl flex-col gap-8 rounded-3xl border border-stone-800 bg-stone-900/60 p-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">BigMind login</p>
          <h1 className="text-3xl font-semibold tracking-tight">Auth wiring is next.</h1>
          <p className="text-stone-300">
            This shell is in place so the app structure is ready. Next step is connecting Supabase
            sign-in and gated access.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5 text-sm text-stone-300">
          Planned methods: magic link email, Google, and Stripe-gated onboarding.
        </div>
        <Link href="/" className="text-sm text-emerald-200 underline underline-offset-4">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
