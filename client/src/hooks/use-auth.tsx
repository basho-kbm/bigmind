import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { apiRequest, getApiBase } from "@/lib/queryClient";

interface User {
  id: number;
  email: string;
  displayName: string | null;
  stripeCustomerId: string | null;
  trialEndsAt: string;
  createdAt: string;
}

interface Subscription {
  id: number;
  userId: number;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSubscription(data.subscription);
        setIsTrialing(data.isTrialing);
        setTrialDaysRemaining(data.trialDaysRemaining);
        setHasActiveSubscription(data.hasActiveSubscription);
      } else {
        setUser(null);
        setSubscription(null);
        setIsTrialing(false);
        setTrialDaysRemaining(0);
        setHasActiveSubscription(false);
      }
    } catch {
      setUser(null);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    // Refetch full user state including subscription
    await fetchUser();
  }, [fetchUser]);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { email, password, displayName });
    const data = await res.json();
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
    setSubscription(null);
    setIsTrialing(false);
    setTrialDaysRemaining(0);
    setHasActiveSubscription(false);
    window.location.hash = "#/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        isLoading,
        isAuthenticated: !!user,
        hasActiveSubscription,
        isTrialing,
        trialDaysRemaining,
        login,
        register,
        logout,
        refetch: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
