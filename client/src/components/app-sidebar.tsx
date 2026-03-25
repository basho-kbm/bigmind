import { Moon, BookHeart, Brain, Timer } from "lucide-react";
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

const navItems = [
  { title: "Sleep", url: "/", icon: Moon },
  { title: "Diary", url: "/diary", icon: BookHeart },
  { title: "Insights", url: "/insights", icon: Brain },
  { title: "Timer", url: "/timer", icon: Timer },
];

export function AppSidebar() {
  const [location] = useLocation();

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
      <SidebarFooter className="p-4">
        <PerplexityAttribution />
      </SidebarFooter>
    </Sidebar>
  );
}
