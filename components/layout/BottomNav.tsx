"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  type IconoirProvider,
} from "iconoir-react";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number | string }>;

const ICON_MAP: Record<string, IconComponent> = {
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
  "file-text": PageSearch,
  reports: PageSearch,
  "dollar-sign": DollarCircle,
  "trending-up": GraphUp,
};

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  enabled: boolean;
}

interface BottomNavProps {
  items?: NavItem[];
}

const DEFAULT_ITEMS: NavItem[] = [
  { id: "accounts", label: "Accounts", icon: "wallet", href: "/accounts", enabled: true },
  { id: "transactions", label: "Transactions", icon: "arrow-left-right", href: "/transactions", enabled: true },
  { id: "dashboard", label: "Home", icon: "home", href: "/dashboard", enabled: true },
  { id: "analytics", label: "Analytics", icon: "bar-chart-2", href: "/analytics", enabled: true },
  { id: "settings", label: "Settings", icon: "settings", href: "/settings", enabled: true },
];

export function BottomNav({ items = DEFAULT_ITEMS }: BottomNavProps) {
  const pathname = usePathname();
  const enabledItems = items.filter((item) => item.enabled).slice(0, 5);

  // Match current active route
  const getActiveItem = React.useCallback(
    (path: string) => {
      return (
        enabledItems.find(
          (item) => path === item.href || (item.href !== "/" && path.startsWith(item.href + "/"))
        )?.href ?? enabledItems[2]?.href ?? enabledItems[0]?.href
      );
    },
    [enabledItems]
  );

  const [activeHref, setActiveHref] = React.useState<string>(() => getActiveItem(pathname));

  React.useEffect(() => {
    setActiveHref(getActiveItem(pathname));
  }, [pathname, getActiveItem]);

  return (
    <nav
      className="fixed bottom-3 left-4 right-4 z-50 md:hidden flex justify-center pointer-events-none"
      role="navigation"
      aria-label="Main mobile navigation"
      id="bottom-nav"
    >
      {/* Floating Pill Glass Container */}
      <div className="pointer-events-auto w-full max-w-md bg-card/65 dark:bg-card/45 backdrop-blur-2xl border border-white/15 dark:border-white/10 rounded-full p-2 shadow-2xl shadow-primary/10 flex items-center justify-between">
        {enabledItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || ICON_MAP[item.id] || HomeSimple;
          const isActive = activeHref === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              onClick={() => setActiveHref(item.href)}
              id={`bottom-nav-${item.id}`}
              className="relative flex items-center justify-center flex-1 h-12 rounded-full transition-colors cursor-pointer select-none"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Liquid Sliding Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="liquidActiveTabPill"
                  className="absolute inset-1 rounded-full bg-primary shadow-lg shadow-primary/30"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 30,
                    mass: 0.8,
                  }}
                >
                  {/* Subtle liquid glow / highlight sheen */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/10 to-white/25 pointer-events-none" />
                </motion.div>
              )}

              {/* Icon */}
              <motion.div
                className="relative z-10 flex items-center justify-center"
                animate={{
                  scale: isActive ? 1.15 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 25,
                }}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 transition-colors duration-200",
                    isActive
                      ? "text-primary-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
