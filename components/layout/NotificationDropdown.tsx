"use client";

import * as React from "react";
import Link from "next/link";
import {
  BellNotification,
  WarningTriangle,
  Clock,
  CheckCircle,
  NavArrowRight,
  Spark,
} from "iconoir-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "REMINDER" | "OVERDUE" | "BUDGET_WARNING" | "BUDGET_EXCEEDED" | "INFO";
  link: string;
  isActionable: boolean;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // safe failover
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "OVERDUE":
      case "BUDGET_EXCEEDED":
        return <WarningTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
      case "BUDGET_WARNING":
        return <WarningTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case "REMINDER":
      default:
        return <Clock className="w-4 h-4 text-primary shrink-0" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id="notification-bell-btn"
        className="relative h-9 w-9 rounded-xl glass-subtle hover:glow-sm transition-all duration-200 flex items-center justify-center cursor-pointer text-foreground"
        aria-label="Notifications"
      >
        <BellNotification className="h-4 w-4" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-lg shadow-rose-500/40 animate-in zoom-in">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="glass-card border-0 w-80 sm:w-96 p-0 overflow-hidden shadow-2xl rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <button
            onClick={fetchNotifications}
            className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
          >
            {isLoading ? <Spark className="w-3 h-3 animate-spin" /> : "Refresh"}
          </button>
        </div>

        {/* List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border/20">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-medium text-foreground">All caught up!</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No pending bills or budget warnings right now.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                prefetch={true}
                className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="mt-0.5">{getIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border/40 bg-background/30 text-center">
          <Link
            href="/reminders"
            prefetch={true}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1 cursor-pointer"
          >
            <span>Manage All Reminders & Bills</span>
            <NavArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
