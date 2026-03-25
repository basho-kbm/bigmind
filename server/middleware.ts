import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function requireSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const user = req.user;
    const now = new Date();
    const trialEnd = new Date(user.trialEndsAt);

    // Allow if trial hasn't expired
    if (now < trialEnd) {
      return next();
    }

    // Check for active subscription
    const subscription = await storage.getSubscriptionByUserId(user.id);
    if (subscription && ["active", "trialing"].includes(subscription.status)) {
      return next();
    }

    // Trial expired and no active subscription
    return res.status(403).json({
      error: "subscription_required",
      trialExpired: true,
      message: "Your trial has expired. Please subscribe to continue.",
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return res.status(500).json({ error: "Failed to verify subscription status" });
  }
}
