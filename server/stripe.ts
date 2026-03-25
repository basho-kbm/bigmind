import { Router } from "express";
import type { Request, Response } from "express";
import { storage } from "./storage";
import { requireAuth } from "./middleware";

let stripe: any = null;

if (process.env.STRIPE_SECRET_KEY) {
  import("stripe").then((Stripe) => {
    stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY!);
    console.log("[stripe] Stripe initialized");
  }).catch((err) => {
    console.warn("[stripe] Failed to initialize Stripe:", err.message);
  });
} else {
  console.warn("[stripe] STRIPE_SECRET_KEY not set — Stripe features disabled");
}

function getStripe() {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.");
  }
  return stripe;
}

// Billing routes (require auth but NOT subscription)
export const billingRouter = Router();

// Create Checkout Session
billingRouter.post("/api/billing/create-checkout", requireAuth, async (req: Request, res: Response) => {
  try {
    const s = getStripe();
    const user = req.user!;
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "priceId is required" });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await s.customers.create({
        email: user.email,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id as string;
      await storage.updateUserStripeCustomerId(user.id, customerId);
    }

    const session = await s.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || "http://localhost:5000"}/#/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || "http://localhost:5000"}/#/pricing`,
      metadata: { userId: String(user.id) },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Create checkout error:", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
});

// Create Customer Portal Session
billingRouter.post("/api/billing/create-portal", requireAuth, async (req: Request, res: Response) => {
  try {
    const s = getStripe();
    const user = req.user!;

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: "No billing account found" });
    }

    const portalSession = await s.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${req.headers.origin || "http://localhost:5000"}/#/account`,
    });

    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Create portal error:", error);
    res.status(500).json({ error: error.message || "Failed to create portal session" });
  }
});

// Webhook handler
export const webhookRouter = Router();

webhookRouter.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
  if (!stripe) {
    console.warn("[stripe] Webhook received but Stripe not configured");
    return res.status(200).json({ received: true });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } else {
      // In development without webhook secret, parse directly
      event = req.body;
      console.warn("[stripe] No webhook secret configured — skipping signature verification");
    }
  } catch (err: any) {
    console.error("[stripe] Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const userId = parseInt(session.metadata?.userId);
          if (userId) {
            // Check if subscription already exists
            const existing = await storage.getSubscriptionByStripeId(sub.id);
            if (!existing) {
              await storage.createSubscription({
                userId,
                stripeSubscriptionId: sub.id,
                stripePriceId: sub.items.data[0]?.price?.id || "",
                status: sub.status,
                currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
                currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
                cancelAtPeriodEnd: sub.cancel_at_period_end || false,
              });
            }

            // Ensure stripe customer ID is saved
            if (session.customer) {
              await storage.updateUserStripeCustomerId(userId, session.customer);
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        await storage.updateSubscription(sub.id, {
          status: sub.status,
          stripePriceId: sub.items.data[0]?.price?.id || "",
          currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: sub.cancel_at_period_end || false,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await storage.updateSubscription(sub.id, {
          status: "canceled",
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await storage.updateSubscription(invoice.subscription, {
            status: "past_due",
          });
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("[stripe] Webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});
