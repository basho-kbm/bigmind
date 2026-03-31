import { type NextRequest, NextResponse } from "next/server";

import { ensureStripeCustomer } from "@/lib/billing";
import { env } from "@/lib/env/server";
import { stripe } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Stripe price is not configured." }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  const customerId = await ensureStripeCustomer({
    userId: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name ?? null,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: `${origin}/app/settings?checkout=success`,
    cancel_url: `${origin}/app/settings?checkout=cancelled`,
    customer_update: {
      name: "auto",
      address: "auto",
    },
    metadata: {
      supabase_user_id: user.id,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
