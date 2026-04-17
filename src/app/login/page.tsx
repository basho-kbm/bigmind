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
          <h1 className="text-3xl font-semibold tracking-tight">Your calm practice starts here.</h1>
          <p className="text-stone-300">
            Enter your email and BigMind will send you a magic link. No password friction,
            no clutter.
          </p>
        </div>

        <LoginForm />

        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5 text-sm text-stone-300">
          BigMind keeps the first step simple right now: one email, one magic link, one calmer way
          into tonight’s session.
        </div>

        <Link href="/" className="text-sm text-emerald-200 underline underline-offset-4">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
