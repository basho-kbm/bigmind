import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/app");
  }

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <div className="mx-auto flex max-w-xl flex-col gap-8 rounded-3xl border border-stone-800 bg-stone-900/60 p-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">BigMind login</p>
          <h1 className="text-3xl font-semibold tracking-tight">Log in with your email.</h1>
          <p className="text-stone-300">
            Already have an account? Enter the same email and BigMind will bring you straight back
            in. New here? This same step starts your free account.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 text-sm text-stone-300">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Returning</p>
            <p className="mt-2">Use the email you already signed up with.</p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 text-sm text-stone-300">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">New tonight</p>
            <p className="mt-2">We’ll email you one link so you can get into the app fast.</p>
          </div>
        </div>

        <LoginForm />

        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5 text-sm text-stone-300">
          No password to remember. Just your email and a quick link back into tonight’s session.
        </div>

        <Link href="/" className="text-sm text-emerald-200 underline underline-offset-4">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
