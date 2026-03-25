import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Crown, Clock, AlertTriangle, LogOut, CreditCard, Sparkles } from "lucide-react";

export default function AccountPage() {
  const { user, subscription, isTrialing, trialDaysRemaining, hasActiveSubscription, logout } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await apiRequest("POST", "/api/billing/create-portal");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to open billing portal:", err);
    } finally {
      setPortalLoading(false);
    }
  }

  if (!user) return null;

  const trialExpired = !isTrialing && !hasActiveSubscription;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold">Account</h1>
        <p className="text-muted-foreground mt-1">Manage your account and subscription</p>
      </div>

      {/* Profile Info */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          {user.displayName && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Name</span>
              <span>{user.displayName}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Member since</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Subscription</CardTitle>
            {hasActiveSubscription && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Crown className="w-3 h-3 mr-1" /> Premium
              </Badge>
            )}
            {isTrialing && !hasActiveSubscription && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Clock className="w-3 h-3 mr-1" /> Trial
              </Badge>
            )}
            {trialExpired && (
              <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
                <AlertTriangle className="w-3 h-3 mr-1" /> Expired
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTrialing && !hasActiveSubscription && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm">
                <strong className="text-blue-400">{trialDaysRemaining} days</strong> remaining in your free trial.
                Subscribe now to keep access to all features.
              </p>
            </div>
          )}

          {hasActiveSubscription && subscription && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{subscription.status}</span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
              )}
              {subscription.cancelAtPeriodEnd && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-400">
                    Your subscription will end on {new Date(subscription.currentPeriodEnd!).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {trialExpired && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                Your trial has expired. Subscribe to regain access to all features.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {(trialExpired || (isTrialing && !hasActiveSubscription)) && (
              <Link href="/pricing">
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" /> Subscribe Now
                </Button>
              </Link>
            )}
            {hasActiveSubscription && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {portalLoading ? "Opening..." : "Manage Subscription"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <Button variant="outline" onClick={logout} className="gap-2 text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
