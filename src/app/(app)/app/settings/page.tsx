export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Settings</p>
      <h2 className="text-3xl font-semibold tracking-tight">Account and billing hub</h2>
      <p className="max-w-2xl text-stone-300">
        Subscription management, preferences, and profile state will connect here after Stripe and
        Supabase auth are live.
      </p>
    </div>
  );
}
