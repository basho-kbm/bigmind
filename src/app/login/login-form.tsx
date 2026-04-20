"use client";

import { useActionState } from "react";

import { sendMagicLink } from "./actions";

const initialLoginActionState = {
  status: "idle" as const,
};

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, initialLoginActionState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-stone-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@knowbigmind.com"
          autoComplete="email"
          required
          className="w-full rounded-2xl border border-stone-700 bg-stone-950/90 px-4 py-3 text-base text-stone-50 outline-none transition placeholder:text-stone-500 focus:border-emerald-400"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-emerald-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Sending your link..." : "Continue with email"}
      </button>

      {state.status !== "idle" && state.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-400/10 text-rose-100"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
