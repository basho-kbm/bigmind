import Stripe from "stripe";

import { getServerEnv } from "@/lib/env/server";

export function getStripeClient() {
  const env = getServerEnv();

  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
    appInfo: {
      name: "BigMind",
      version: "0.1.0",
    },
  });
}
