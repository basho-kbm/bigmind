import { Moon, Sunrise, BookHeart, Brain, Timer, User, Crown, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { BigMindLogo } from "./BigMindLogo";
import { PerplexityAttribution } from "./PerplexityAttribution";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Sleep", url: "/", icon: Moon },
  { title: "Daily", url: "/daily", icon: Sunrise },
  { title: "Diary", url: "/diary", icon: BookHeart },
  { title: "Insights", url: "/insights", icon: Brain },
  { title: "Timer", url: "/timer", icon: Timer },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isTrialing, trialDaysRemaining, hasActiveSubscription } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/" className="flex items-center gap-3 group" data-testid="link-home">
          <BigMindLogo className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-105" />
          <div>
            <h1 className="font-display text-lg font-medium leading-none tracking-tight" data-testid="text-app-name">
              BigMind
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Meditation &amp; Sleep</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={isActive ? "bg-primary/10 text-primary" : ""}
                    >
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-3">
        {/* Account link with subscription badge */}
        {user && (
          <Link href="/account" data-testid="link-account">
            <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-accent/50 ${
              location === "/account" ? "bg-primary/10 text-primary" : ""
            }`}>
              <User className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user.displayName || user.email}</p>
              </div>
              {hasActiveSubscription && (
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                  <Crown className="w-2.5 h-2.5 mr-0.5" /> PRO
                </Badge>
              )}
              {isTrialing && !hasActiveSubscription && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0">
                  <Clock className="w-2.5 h-2.5 mr-0.5" /> {trialDaysRemaining}d
                </Badge>
              )}
            </div>
          </Link>
        )}
        <PerplexityAttribution />
      </SidebarFooter>
    </Sidebar>
  );
}
