import Stripe from "stripe";

import { markSubscriptionCanceled, syncSubscriptionFromStripe } from "@/lib/billing";
import { env } from "@/lib/env/server";
import { stripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.subscription && typeof session.subscription === "string") {
        await syncSubscriptionFromStripe(session.subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      await syncSubscriptionFromStripe(subscription.id);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await markSubscriptionCanceled({
        subscriptionId: subscription.id,
        customerId: typeof subscription.customer === "string" ? subscription.customer : null,
      });
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
