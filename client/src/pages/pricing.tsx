import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Check, Sparkles, Crown } from "lucide-react";
import { BigMindLogo } from "@/components/BigMindLogo";

const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_MONTHLY || "price_1T1qn9CEc8DYdaCCXi79W9XK";
const ANNUAL_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ANNUAL || "price_1TExqxCEc8DYdaCCEIjIvpjX";

const features = [
  "Guided sleep meditations",
  "Meditation timer with bells",
  "AI meditation journal (Roshi)",
  "Personal practice insights",
  "Full audio library access",
  "New content added regularly",
];

export default function PricingPage() {
  const { isAuthenticated, isTrialing, trialDaysRemaining } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(priceId: string) {
    if (!isAuthenticated) {
      window.location.hash = "#/register";
      return;
    }

    setLoading(priceId);
    try {
      const res = await apiRequest("POST", "/api/billing/create-checkout", { priceId });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center mb-10 space-y-4">
        <BigMindLogo className="w-12 h-12 text-primary mx-auto" />
        <h1 className="text-3xl font-display font-semibold">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {isTrialing
            ? `You have ${trialDaysRemaining} days left in your trial. Subscribe to keep full access.`
            : "Unlock all BigMind features with a premium subscription."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
        {/* Monthly Plan */}
        <Card className="border-border/50 bg-card/50 backdrop-blur relative">
          <CardHeader>
            <CardTitle className="text-xl">Monthly</CardTitle>
            <CardDescription>Perfect for trying premium</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$11.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSubscribe(MONTHLY_PRICE_ID)}
              disabled={loading !== null}
            >
              {loading === MONTHLY_PRICE_ID ? "Redirecting..." : "Subscribe Monthly"}
            </Button>
          </CardFooter>
        </Card>

        {/* Annual Plan */}
        <Card className="border-primary/30 bg-card/50 backdrop-blur relative ring-1 ring-primary/20 shadow-lg shadow-primary/5">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground px-3 py-1 shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" /> Save 17%
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              Annual <Crown className="w-5 h-5 text-primary" />
            </CardTitle>
            <CardDescription>Best value for committed practitioners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$119</span>
              <span className="text-muted-foreground">/year</span>
            </div>
            <p className="text-sm text-muted-foreground">
              That's just <strong className="text-foreground">$9.92/month</strong> — save 17%
            </p>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleSubscribe(ANNUAL_PRICE_ID)}
              disabled={loading !== null}
            >
              {loading === ANNUAL_PRICE_ID ? "Redirecting..." : "Subscribe Annually"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {!isAuthenticated && (
        <p className="text-sm text-muted-foreground mt-8 text-center">
          New here? <a href="/#/register" className="text-primary hover:underline">Create an account</a> to start your 14-day free trial.
        </p>
      )}
    </div>
  );
}
