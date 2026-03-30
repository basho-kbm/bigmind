import Stripe from "stripe";

import { env } from "@/lib/env/server";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
  appInfo: {
    name: "BigMind",
    version: "0.1.0",
  },
});
