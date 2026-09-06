"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  HomeSimple,
  Wallet,
  DataTransferBoth,
  StatsUpSquare,
  PiggyBank,
  Trophy,
  BellNotification,
  PageSearch,
  Settings,
  LogOut,
  Xmark,
  SunLight,
  HalfMoon,
  Laptop,
  NavArrowRight,
  User,
} from "iconoir-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NavSection {
  title: string;
  items: {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: HomeSimple },
      { title: "Accounts", href: "/accounts", icon: Wallet },
      { title: "Transactions", href: "/transactions", icon: DataTransferBoth },
      { title: "Analytics", href: "/analytics", icon: StatsUpSquare },
    ],
  },
  {
    title: "PLANNING & TRACKING",
    items: [
      { title: "Budgets", href: "/budget", icon: PiggyBank },
      { title: "Goals", href: "/goals", icon: Trophy },
      { title: "Reminders", href: "/reminders", icon: BellNotification },
      { title: "Reports", href: "/reports", icon: PageSearch },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar({ open, onOpenChange }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "F";

  const currency = (user as any)?.currency || "USD";

  const isItemActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[300px] sm:w-[340px] p-0 flex flex-col bg-background/95 dark:bg-background/90 backdrop-blur-2xl border-r border-border/50 shadow-2xl z-50 overflow-hidden"
      >
        {/* Header Branding & Close Button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-card/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
              <span className="text-primary-foreground font-black text-sm">F</span>
            </div>
            <div className="flex flex-col">
              <SheetTitle className="font-heading font-black text-lg tracking-tight gradient-text leading-none">
                FINCY
              </SheetTitle>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                Smart Financial Suite
              </span>
            </div>
          </div>

          <Button
            id="sidebar-close-btn"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-xl glass-subtle hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            aria-label="Close sidebar"
          >
            <Xmark className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>

        {/* User Card */}
        {user && (
          <div className="px-5 py-3.5 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {user.name ?? "User"}
                  </p>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-primary font-mono border-primary/30">
                    {currency}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email ?? ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider font-mono">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={() => onOpenChange(false)}
                      id={`sidebar-link-${item.title.toLowerCase()}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer",
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                          active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                        )}
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={active ? "secondary" : "default"}
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {active && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions (Theme + Logout) */}
        <div className="p-4 border-t border-border/40 bg-card/40 space-y-3">
          {/* Quick Theme Switcher */}
          {mounted && (
            <div className="flex items-center justify-between px-2 py-1 bg-muted/40 rounded-xl border border-border/30">
              <span className="text-xs font-medium text-muted-foreground">Theme</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                    theme === "light"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Light theme"
                >
                  <SunLight className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                    theme === "dark"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Dark theme"
                >
                  <HalfMoon className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                    theme === "system"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="System theme"
                >
                  <Laptop className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <Button
            id="sidebar-logout-btn"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              signOut({ callbackUrl: "/login" });
            }}
            className="w-full h-10 rounded-xl border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 text-destructive font-medium flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
            <span>Sign Out</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
