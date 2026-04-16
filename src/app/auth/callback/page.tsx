"use client";

import { useEffect, useMemo, useState } from "react";
import { type EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const validOtpTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Signing you in…");
  const next = useMemo(() => {
    if (typeof window === "undefined") {
      return "/app";
    }

    return new URLSearchParams(window.location.search).get("next") ?? "/app";
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function completeAuth() {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      const queryError = query.get("error");
      const hashError = hash.get("error") || hash.get("error_code");
      if (queryError || hashError) {
        window.location.replace("/login?error=auth-confirmation-failed");
        return;
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          window.location.replace(next);
          return;
        }
      }

      const tokenHash = query.get("token_hash");
      const type = query.get("type");
      if (tokenHash && type && validOtpTypes.has(type as EmailOtpType)) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });

        if (!error) {
          window.location.replace(next);
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        window.location.replace(next);
        return;
      }

      setMessage("That sign-in link did not complete. Sending you back to login…");
      window.location.replace("/login?error=auth-confirmation-failed");
    }

    completeAuth();
  }, [next]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 py-16 text-stone-50">
      <div className="w-full max-w-md rounded-3xl border border-stone-800 bg-stone-900/60 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">BigMind auth</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{message}</h1>
        <p className="mt-3 text-sm text-stone-300">Please keep this tab open for a moment.</p>
      </div>
    </main>
  );
}
