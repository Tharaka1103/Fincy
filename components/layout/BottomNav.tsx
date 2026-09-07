"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeSimple,
  Wallet,
  DataTransferBoth,
  StatsUpSquare,
  Settings,
  Trophy,
  BellNotification,
  PiggyBank,
  PageSearch,
  DollarCircle,
  GraphUp,
  Plus,
  Xmark,
  OpenBook,
  Spark,
} from "iconoir-react";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number | string }>;

export const ICON_MAP: Record<string, IconComponent> = {
  home: HomeSimple,
  dashboard: HomeSimple,
  wallet: Wallet,
  accounts: Wallet,
  "arrow-left-right": DataTransferBoth,
  transactions: DataTransferBoth,
  "bar-chart-2": StatsUpSquare,
  analytics: StatsUpSquare,
  settings: Settings,
  target: Trophy,
  goals: Trophy,
  bell: BellNotification,
  reminders: BellNotification,
  "pie-chart": PiggyBank,
  budget: PiggyBank,
  budgets: PiggyBank,
  "file-text": PageSearch,
  reports: PageSearch,
  "dollar-sign": DollarCircle,
  "trending-up": GraphUp,
};

export const FAB_ACTIONS = [
  {
    label: "Transaction",
    icon: DataTransferBoth,
    href: "/transactions?add=true",
    color: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    label: "Account",
    icon: Wallet,
    href: "/accounts?add=true",
    color: "#3b82f6",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    label: "Budget",
    icon: PiggyBank,
    href: "/budget?add=true",
    color: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    label: "Goal",
    icon: Trophy,
    href: "/goals?add=true",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    label: "Reminder",
    icon: BellNotification,
    href: "/reminders?add=true",
    color: "#ef4444",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    label: "Category",
    icon: OpenBook,
    href: "/settings?tab=categories&add=true",
    color: "#06b6d4",
    gradient: "from-cyan-500 to-blue-600",
  },
];

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  enabled: boolean;
}

interface BottomNavProps {
  items?: NavItem[];
  centerButtonMode?: "link" | "action"; // "link" = standard dashboard, "action" = FAB
}

const DEFAULT_ITEMS: NavItem[] = [
  { id: "accounts", label: "Accounts", icon: "wallet", href: "/accounts", enabled: true },
  { id: "transactions", label: "Transactions", icon: "arrow-left-right", href: "/transactions", enabled: true },
  { id: "dashboard", label: "Home", icon: "home", href: "/dashboard", enabled: true },
  { id: "analytics", label: "Analytics", icon: "bar-chart-2", href: "/analytics", enabled: true },
  { id: "settings", label: "Settings", icon: "settings", href: "/settings", enabled: true },
];

export function BottomNav({ items = DEFAULT_ITEMS, centerButtonMode = "link" }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const enabledItems = React.useMemo(() => {
    const rawList: NavItem[] = Array.isArray(items)
      ? items
      : (Array.isArray((items as any)?.items) ? (items as any).items : DEFAULT_ITEMS);
    return rawList.filter((item: NavItem) => item.enabled).slice(0, 5);
  }, [items]);

  const [fabOpen, setFabOpen] = React.useState(false);

  // Close FAB only when path changes
  React.useEffect(() => {
    setFabOpen(false);
  }, [pathname]);

  // Determine center index
  const centerIndex = Math.floor(enabledItems.length / 2);

  return (
    <>
      {/* FAB Backdrop */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={() => setFabOpen(false)}
        />
      )}

      <nav
        className="fixed bottom-3 left-4 right-4 z-50 md:hidden flex justify-center pointer-events-none"
        role="navigation"
        aria-label="Main mobile navigation"
        id="bottom-nav"
      >
        {/* Floating Pill Glass Container */}
        <div className="relative pointer-events-auto w-full max-w-md bg-card/85 dark:bg-card/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full p-2 shadow-2xl shadow-primary/10 flex items-center justify-between">
          {enabledItems.map((item, idx) => {
            const Icon = ICON_MAP[item.icon] || ICON_MAP[item.id] || HomeSimple;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            const isCenterSlot = idx === centerIndex;
            const showFAB = isCenterSlot && centerButtonMode === "action";

            if (showFAB) {
              // ─── FAB Center Button ──────────────────────────────────────
              return (
                <div key={`fab-center-${item.id}`} className="relative flex-1 flex items-center justify-center">
                  {/* Floating Quick Actions Card (Speed-Dial) */}
                  {fabOpen && (
                    <div
                      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[310px] sm:w-[330px] rounded-2xl bg-card border border-border shadow-2xl p-4 pointer-events-auto z-50 flex flex-col gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold tracking-tight text-foreground">
                            Quick Actions
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFabOpen(false)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                          aria-label="Close"
                        >
                          <Xmark className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 3x2 Action Grid */}
                      <div className="grid grid-cols-3 gap-2 bg-card">
                        {FAB_ACTIONS.map((action) => {
                          const ActionIcon = action.icon;
                          return (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => {
                                setFabOpen(false);
                                router.push(action.href);
                              }}
                              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/80 dark:bg-muted/20 dark:hover:bg-muted/40 border border-border hover:border-primary/40 transition-colors cursor-pointer group select-none text-center"
                              id={`fab-action-${action.label.toLowerCase()}`}
                            >
                              <div
                                className={cn(
                                  "w-11 h-11 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-105",
                                  action.gradient
                                )}
                              >
                                <ActionIcon className="w-5 h-5" strokeWidth={2.2} />
                              </div>
                              <span className="text-[11px] font-semibold text-foreground mt-1.5 line-clamp-1">
                                {action.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* FAB Button itself */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFabOpen((v) => !v);
                    }}
                    className={cn(
                      "relative -translate-y-2.5 h-13 w-13 rounded-full shadow-xl flex items-center justify-center cursor-pointer z-50 transition-colors",
                      fabOpen
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground shadow-primary/30"
                    )}
                    id="bottom-nav-fab"
                    aria-label={fabOpen ? "Close quick actions" : "Open quick actions"}
                  >
                    {fabOpen ? (
                      <Xmark className="h-6 w-6 stroke-[2.5]" />
                    ) : (
                      <Plus className="h-6 w-6 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              );
            }

            // ─── Normal Nav Item ───────────────────────────────────────
            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={true}
                id={`bottom-nav-${item.id}`}
                className="relative flex items-center justify-center flex-1 h-12 rounded-full transition-colors cursor-pointer select-none"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <div className="absolute inset-1 rounded-full bg-primary shadow-md" />
                )}

                <Icon
                  className={cn(
                    "w-6 h-6 relative z-10 transition-colors duration-200",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
