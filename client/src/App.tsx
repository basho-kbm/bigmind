import { Switch, Route, Router, Redirect, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import SleepPage from "@/pages/sleep";
import DiaryPage from "@/pages/diary";
import InsightsPage from "@/pages/insights";
import TimerPage from "@/pages/timer";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import AccountPage from "@/pages/account";
import PricingPage from "@/pages/pricing";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DailyPage from "@/pages/daily";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading, isTrialing, hasActiveSubscription } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // If trial expired and no active subscription, redirect to pricing
  if (!isTrialing && !hasActiveSubscription) {
    return <Redirect to="/pricing" />;
  }

  return <Component />;
}

function AuthRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function AuthRequiredRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <ProtectedRoute component={SleepPage} />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/landing" component={LandingPage} />
      <Route path="/login">{() => <AuthRoute component={LoginPage} />}</Route>
      <Route path="/register">{() => <AuthRoute component={RegisterPage} />}</Route>
      <Route path="/pricing" component={PricingPage} />
      <Route path="/account">{() => <AuthRequiredRoute component={AccountPage} />}</Route>
      <Route path="/">{() => <RootRoute />}</Route>
      <Route path="/daily">{() => <ProtectedRoute component={DailyPage} />}</Route>
      <Route path="/diary">{() => <ProtectedRoute component={DiaryPage} />}</Route>
      <Route path="/diary/:id">{() => <ProtectedRoute component={DiaryPage} />}</Route>
      <Route path="/insights">{() => <ProtectedRoute component={InsightsPage} />}</Route>
      <Route path="/timer">{() => <ProtectedRoute component={TimerPage} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  const isLandingPage = location === "/landing";

  // For auth pages (login/register), landing page, or unauthenticated users — no sidebar
  if (isLandingPage || (!isAuthenticated && !isLoading)) {
    return (
      <main className="h-screen w-full overflow-auto">
        <AppRouter />
      </main>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-3 border-b border-border/50 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const sidebarStyle = {
  "--sidebar-width": "15rem",
  "--sidebar-width-icon": "3rem",
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <AuthProvider>
            <AppLayout />
          </AuthProvider>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
