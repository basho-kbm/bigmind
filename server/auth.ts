import { Router } from "express";
import type { Request, Response, Express } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import crypto from "crypto";

// Extend Express types for passport
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      passwordHash: string;
      displayName: string | null;
      stripeCustomerId: string | null;
      trialEndsAt: string;
      createdAt: string;
    }
  }
}

const BCRYPT_ROUNDS = 12;

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);

  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: "lax",
        secure: false, // set to true behind HTTPS proxy
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email.toLowerCase().trim());
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user || undefined);
    } catch (err) {
      done(err);
    }
  });
}

// Auth routes
export const authRouter = Router();

// Register
authRouter.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await storage.getUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Set trial to 14 days from now
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const user = await storage.createUser({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName || null,
      stripeCustomerId: null,
      trialEndsAt,
    });

    // Auto-login after registration
    await new Promise<void>((resolve, reject) => {
      req.login(user, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
authRouter.post("/api/auth/login", (req: Request, res: Response) => {
  passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
    if (err) {
      return res.status(500).json({ error: "Login failed" });
    }
    if (!user) {
      return res.status(401).json({ error: info?.message || "Invalid email or password" });
    }
    req.login(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({ error: "Login failed" });
      }
      const { passwordHash: _, ...safeUser } = user;
      return res.json(safeUser);
    });
  })(req, res);
});

// Logout
authRouter.post("/api/auth/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logged out" });
  });
});

// Get current user + subscription status
authRouter.get("/api/auth/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = req.user;
    const subscription = await storage.getSubscriptionByUserId(user.id);

    const now = new Date();
    const trialEnd = new Date(user.trialEndsAt);
    const isTrialing = now < trialEnd;
    const trialDaysRemaining = isTrialing
      ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const hasActiveSubscription = subscription
      ? ["active", "trialing"].includes(subscription.status)
      : false;

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      user: safeUser,
      subscription: subscription || null,
      isTrialing,
      trialDaysRemaining,
      hasActiveSubscription,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});
