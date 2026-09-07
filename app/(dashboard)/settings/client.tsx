"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  User,
  Shield,
  SmartphoneDevice,
  HistoricShield,
  FloppyDisk,
  Check,
  Key,
  LogOut,
  Spark,
  NavArrowUp,
  NavArrowDown,
  Eye,
  EyeClosed,
  InfoCircle,
  Xmark,
  Play,
  HomeSimple,
  Wallet,
  DataTransferBoth,
  StatsUpSquare,
  Settings,
  Trophy,
  BellNotification,
  PiggyBank,
  PageSearch,
  Plus,
  OpenBook,
} from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  enabled: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface SessionInfo {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  isActive: boolean;
  lastSeenAt: string;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  currency: string;
  createdAt: Date;
}

interface SettingsClientProps {
  user: UserProfile;
  initialNavItems: NavItem[];
  initialCenterButtonMode?: "link" | "action";
  auditLogs: AuditLog[];
  sessions: SessionInfo[];
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: "accounts", label: "Accounts", icon: "wallet", href: "/accounts", enabled: true },
  { id: "transactions", label: "Transactions", icon: "arrow-left-right", href: "/transactions", enabled: true },
  { id: "dashboard", label: "Home", icon: "home", href: "/dashboard", enabled: true },
  { id: "analytics", label: "Analytics", icon: "bar-chart-2", href: "/analytics", enabled: true },
  { id: "settings", label: "Settings", icon: "settings", href: "/settings", enabled: true },
];

const AVAILABLE_CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "LKR", symbol: "Rs", label: "Sri Lankan Rupee (Rs)" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar (C$)" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen (¥)" },
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (S$)" },
  { code: "AED", symbol: "AED", label: "UAE Dirham (AED)" },
];

// All available nav link options (5 visible at once, center can be FAB)
const ALL_NAV_OPTIONS = [
  { id: "dashboard", label: "Home", icon: "dashboard", href: "/dashboard", IconComp: HomeSimple },
  { id: "accounts", label: "Accounts", icon: "accounts", href: "/accounts", IconComp: Wallet },
  { id: "transactions", label: "Transactions", icon: "transactions", href: "/transactions", IconComp: DataTransferBoth },
  { id: "analytics", label: "Analytics", icon: "analytics", href: "/analytics", IconComp: StatsUpSquare },
  { id: "settings", label: "Settings", icon: "settings", href: "/settings", IconComp: Settings },
  { id: "budget", label: "Budget", icon: "budget", href: "/budget", IconComp: PiggyBank },
  { id: "goals", label: "Goals", icon: "goals", href: "/goals", IconComp: Trophy },
  { id: "reminders", label: "Reminders", icon: "reminders", href: "/reminders", IconComp: BellNotification },
  { id: "reports", label: "Reports", icon: "reports", href: "/reports", IconComp: PageSearch },
];

type InfoModalMode = "action" | "link" | null;

// ─── Info Modal Component ─────────────────────────────────────────────────
function InfoModal({
  mode,
  onClose,
}: {
  mode: InfoModalMode;
  onClose: () => void;
}) {
  const isAction = mode === "action";
  // Stage: "webp" (try webp first) -> "video" (try mp4/webm next) -> "none" (fallback banner)
  const [mediaStage, setMediaStage] = React.useState<"webp" | "video" | "none">("webp");
  // Default to 1:1 square, automatically adjusts to media's natural aspect ratio upon loading
  const [aspectRatio, setAspectRatio] = React.useState<number>(1);

  React.useEffect(() => {
    setMediaStage("webp");
    setAspectRatio(1);
  }, [mode]);

  const webpSrc = isAction ? "/videos/action-btn.webp" : "/videos/link-btn.webp";
  const mp4Src = isAction ? "/videos/action-btn.mp4" : "/videos/link-btn.mp4";
  const webmSrc = isAction ? "/videos/action-btn.webm" : "/videos/link-btn.webm";

  return (
    <Dialog open={!!mode} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="glass-card border border-border/50 max-w-sm sm:max-w-md p-0 overflow-hidden rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        <DialogTitle className="sr-only">
          {isAction ? "Action Button Mode Information" : "Normal Link Mode Information"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isAction
            ? "Information about Action Button Mode with Quick Actions"
            : "Information about Normal Link Mode"}
        </DialogDescription>

        {/* Top: Full-bleed Media Section with dynamic natural aspect ratio (default 1:1 square) */}
        <div
          className="relative w-full bg-black/90 shrink-0 overflow-hidden flex items-center justify-center border-b border-border/30 select-none max-h-[52vh]"
          style={{ aspectRatio: `${aspectRatio}` }}
        >
          {/* Close button ONLY in the top header/video area */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg border border-white/10"
            aria-label="Close"
          >
            <Xmark className="w-4 h-4" strokeWidth={2.2} />
          </button>

          {/* 1. Animated WebP image (natively loops and displays in browsers) */}
          {mediaStage === "webp" && (
            <img
              key={`img-${webpSrc}`}
              src={webpSrc}
              alt={isAction ? "Action Button Mode Demo" : "Normal Link Mode Demo"}
              className="w-full h-full object-contain"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setAspectRatio(img.naturalWidth / img.naturalHeight);
                }
              }}
              onError={() => setMediaStage("video")}
            />
          )}

          {/* 2. Video tag fallback if mp4 or webm is provided instead */}
          {mediaStage === "video" && (
            <video
              key={`vid-${mp4Src}`}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-contain"
              onLoadedMetadata={(e) => {
                const vid = e.currentTarget;
                if (vid.videoWidth && vid.videoHeight) {
                  setAspectRatio(vid.videoWidth / vid.videoHeight);
                }
              }}
              onError={() => setMediaStage("none")}
            >
              <source src={mp4Src} type="video/mp4" />
              <source src={webmSrc} type="video/webm" />
            </video>
          )}

          {/* 3. High-fidelity visual showcase fallback if neither file is uploaded yet */}
          {mediaStage === "none" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background/60 to-muted/80 p-6 text-center">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-primary/25 blur-2xl animate-pulse" />
                <div className="w-14 h-14 rounded-2xl bg-card/90 border border-border shadow-2xl flex items-center justify-center relative z-10 backdrop-blur-sm">
                  {isAction ? (
                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
                      <HomeSimple className="w-5 h-5 stroke-[2]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border/60 text-[11px] font-semibold text-foreground shadow-sm">
                <Play className="w-3.5 h-3.5 text-primary fill-primary" />
                <span>Preview Demonstration</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Upload <code className="text-primary font-mono">{isAction ? "action-btn.webp" : "link-btn.webp"}</code> to <code className="font-mono">/public/videos/</code>
              </p>
            </div>
          )}
        </div>

        {/* Bottom: Mode Title, Description & Action Details (Scrollbar completely hidden) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Mode Title & Icon placed above the description */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                {isAction ? (
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <HomeSimple className="h-5 w-5 stroke-[2]" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isAction ? "Action Button Mode" : "Normal Link Mode"}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {isAction ? "Quick Actions at Your Fingertips" : "Dedicated Dashboard Navigation"}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isAction ? (
                <>
                  The center button becomes an elevated <strong>floating action button (FAB)</strong>.
                  Tapping it reveals a smooth popup grid with immediate shortcuts — Add Transaction, Add Account,
                  Budget, Goal, Reminder, and Category — from any view.
                </>
              ) : (
                <>
                  The center button acts as a <strong>standard navigation link</strong> pointing directly to
                  your Dashboard. Tapping it quickly brings you back to your primary financial overview and analytics.
                </>
              )}
            </p>

            {/* Feature tags */}
            {isAction ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {["Add Transaction", "Add Account", "Add Budget", "Add Goal", "Add Reminder", "Add Category"].map(a => (
                  <span key={a} className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">
                  Destination: /dashboard
                </span>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={onClose}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm shadow-md cursor-pointer"
              >
                Got it!
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Live Bottom Nav Preview ─────────────────────────────────────────────
function BottomNavPreview({
  items,
  centerButtonMode,
  activeHref = "/dashboard",
}: {
  items: NavItem[];
  centerButtonMode: "link" | "action";
  activeHref?: string;
}) {
  const [previewFabOpen, setPreviewFabOpen] = React.useState(false);
  const [clickedAction, setClickedAction] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (centerButtonMode === "link") setPreviewFabOpen(false);
  }, [centerButtonMode]);

  const safeList: NavItem[] = Array.isArray(items)
    ? items
    : (Array.isArray((items as any)?.items) ? (items as any).items : DEFAULT_NAV_ITEMS);
  const enabledItems = safeList.filter((i: NavItem) => i.enabled).slice(0, 5);
  const centerIndex = Math.floor(enabledItems.length / 2);

  const ICON_MAP: Record<string, React.ComponentType<any>> = {
    home: HomeSimple, dashboard: HomeSimple, wallet: Wallet, accounts: Wallet,
    "arrow-left-right": DataTransferBoth, transactions: DataTransferBoth,
    "bar-chart-2": StatsUpSquare, analytics: StatsUpSquare,
    settings: Settings, goals: Trophy, trophy: Trophy, budget: PiggyBank, budgets: PiggyBank,
    reminders: BellNotification, bell: BellNotification, reports: PageSearch,
  };

  const PREVIEW_ACTIONS = [
    { label: "Transaction", icon: DataTransferBoth, gradient: "from-violet-500 to-purple-600", glow: "shadow-violet-500/25" },
    { label: "Account", icon: Wallet, gradient: "from-blue-500 to-indigo-600", glow: "shadow-blue-500/25" },
    { label: "Budget", icon: PiggyBank, gradient: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/25" },
    { label: "Goal", icon: Trophy, gradient: "from-amber-500 to-orange-600", glow: "shadow-amber-500/25" },
    { label: "Reminder", icon: BellNotification, gradient: "from-rose-500 to-pink-600", glow: "shadow-rose-500/25" },
    { label: "Category", icon: OpenBook, gradient: "from-cyan-500 to-blue-600", glow: "shadow-cyan-500/25" },
  ];

  return (
    <div className="flex flex-col items-center py-3 relative">
      {/* Backdrop for preview when open */}
      {previewFabOpen && (
        <div
          onClick={() => setPreviewFabOpen(false)}
          className="fixed inset-0 z-30 bg-black/40"
        />
      )}

      <div className="relative z-40 w-full max-w-sm flex flex-col items-center">
        {/* Quick Actions Popup in Preview */}
        {previewFabOpen && centerButtonMode === "action" && (
          <div
            className="absolute bottom-16 w-[300px] rounded-2xl bg-card dark:bg-[#12131e] border border-border shadow-2xl p-3.5 flex flex-col gap-2.5 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-foreground">Quick Actions Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFabOpen(false)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Xmark className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3x2 Grid */}
            <div className="grid grid-cols-3 gap-2">
              {PREVIEW_ACTIONS.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      setClickedAction(action.label);
                      setTimeout(() => setClickedAction(null), 1500);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/40 hover:bg-muted/70 dark:bg-muted/20 border border-border/40 transition-colors cursor-pointer select-none"
                  >
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md", action.gradient, action.glow)}>
                      <ActionIcon className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground mt-1 line-clamp-1">{action.label}</span>
                  </button>
                );
              })}
            </div>

            {clickedAction && (
              <div className="text-center text-[10px] font-medium text-primary py-0.5">
                ✓ Clicked {clickedAction}!
              </div>
            )}
          </div>
        )}

        {/* Floating Pill Container */}
        <div className="bg-card/85 dark:bg-card/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full p-2 shadow-xl flex items-center gap-1 w-full justify-between">
          {enabledItems.map((item, idx) => {
            const isFABCenter = idx === centerIndex && centerButtonMode === "action";
            const isActive = item.href === activeHref || item.href === "/dashboard";
            const Icon = ICON_MAP[item.icon] || ICON_MAP[item.id] || HomeSimple;

            if (isFABCenter) {
              return (
                <div key={`fab-prev-${item.id}`} className="relative flex-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setPreviewFabOpen((v) => !v)}
                    className={cn(
                      "relative -translate-y-2.5 h-12 w-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer z-40 transition-colors ring-4 ring-background",
                      previewFabOpen
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground shadow-primary/30"
                    )}
                    aria-label="Toggle preview actions"
                  >
                    {previewFabOpen ? (
                      <Xmark className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <Plus className="h-5 w-5 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className="relative flex items-center justify-center flex-1 h-10 rounded-full cursor-default"
              >
                {isActive && (
                  <div className="absolute inset-1 rounded-full bg-primary/90 shadow-md" />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 relative z-10",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
              </div>
            );
          })}
        </div>

        {centerButtonMode === "action" && (
          <p className="text-[11px] text-muted-foreground/80 mt-2 text-center">
            Click the center <span className="font-semibold text-primary">{previewFabOpen ? "✕" : "+"}</span> button to test Quick Actions
          </p>
        )}
      </div>
    </div>
  );
}


export function SettingsClient({
  user,
  initialNavItems,
  initialCenterButtonMode = "link",
  auditLogs,
  sessions,
}: SettingsClientProps) {
  const router = useRouter();

  // Profile state
  const [name, setName] = React.useState(user.name || "");
  const [currency, setCurrency] = React.useState(user.currency || "USD");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  // Safely resolve nav items even if initialNavItems is wrapped or unexpected
  const safeInitialItems = React.useMemo<NavItem[]>(() => {
    if (Array.isArray(initialNavItems)) return initialNavItems;
    if (initialNavItems && Array.isArray((initialNavItems as any).items)) {
      return (initialNavItems as any).items;
    }
    return DEFAULT_NAV_ITEMS;
  }, [initialNavItems]);

  // Bottom Nav items state — ensure planning links available
  const [navItems, setNavItems] = React.useState<NavItem[]>(safeInitialItems);
  const [centerButtonMode, setCenterButtonMode] = React.useState<"link" | "action">(initialCenterButtonMode);
  const [isSavingNav, setIsSavingNav] = React.useState(false);
  const [navSuccess, setNavSuccess] = React.useState(false);
  const [infoModalMode, setInfoModalMode] = React.useState<InfoModalMode>(null);

  // Sync state if initialNavItems or initialCenterButtonMode changes from server
  React.useEffect(() => {
    if (Array.isArray(initialNavItems)) {
      setNavItems(initialNavItems);
    } else if (initialNavItems && Array.isArray((initialNavItems as any).items)) {
      setNavItems((initialNavItems as any).items);
    }
    if (initialCenterButtonMode) {
      setCenterButtonMode(initialCenterButtonMode);
    }
  }, [initialNavItems, initialCenterButtonMode]);

  // Password state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordMsg, setPasswordMsg] = React.useState<{ error?: string; success?: string } | null>(null);

  // Load nav config on mount (to verify centerButtonMode and items from API)
  React.useEffect(() => {
    fetch("/api/v1/settings/bottom-nav")
      .then(r => r.json())
      .then(data => {
        if (data?.centerButtonMode) setCenterButtonMode(data.centerButtonMode);
        if (Array.isArray(data?.items)) setNavItems(data.items);
      })
      .catch(() => { });
  }, []);

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/v1/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Nav Items Reorder
  const moveNavItem = (index: number, direction: "up" | "down") => {
    const list = Array.isArray(navItems) ? [...navItems] : [...DEFAULT_NAV_ITEMS];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    setNavItems(list);
  };

  const toggleNavItem = (id: string) => {
    setNavItems((prev) => {
      const list = Array.isArray(prev) ? prev : DEFAULT_NAV_ITEMS;
      return list.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item));
    });
  };

  // Add a new nav link from all-options picker
  const addNavLink = (option: typeof ALL_NAV_OPTIONS[0]) => {
    setNavItems((prev) => {
      const list = Array.isArray(prev) ? prev : DEFAULT_NAV_ITEMS;
      if (list.find(i => i.id === option.id)) return list; // already in list
      return [...list, { id: option.id, label: option.label, icon: option.icon, href: option.href, enabled: true }];
    });
  };

  const removeNavLink = (id: string) => {
    setNavItems((prev) => {
      const list = Array.isArray(prev) ? prev : DEFAULT_NAV_ITEMS;
      if (list.length <= 3) return list;
      return list.filter(i => i.id !== id);
    });
  };

  const handleSaveNav = async () => {
    setIsSavingNav(true);
    setNavSuccess(false);

    const currentNavList = Array.isArray(navItems) ? navItems : DEFAULT_NAV_ITEMS;
    const enabledItems = currentNavList.filter(i => i.enabled).slice(0, 5);
    if (enabledItems.length < 3) {
      alert("You need at least 3 enabled nav items.");
      setIsSavingNav(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/settings/bottom-nav", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: currentNavList.slice(0, 5), centerButtonMode }),
      });

      if (!res.ok) throw new Error("Failed to save bottom navigation");
      setNavSuccess(true);
      router.refresh();
      setTimeout(() => setNavSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save navigation");
    } finally {
      setIsSavingNav(false);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ error: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ error: "Password must be at least 8 characters long" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/v1/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Password change failed");

      setPasswordMsg({ success: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ error: err.message || "Failed to change password" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const safeNavList = Array.isArray(navItems) ? navItems : DEFAULT_NAV_ITEMS;
  const availableToAdd = ALL_NAV_OPTIONS.filter(o => !safeNavList.find(i => i.id === o.id));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage your account profile, customize bottom bar navigation, and adjust security controls.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:flex sm:w-auto sm:inline-flex gap-1.5 sm:gap-1 p-1.5 bg-card/50 backdrop-blur-xl border border-border/40 rounded-2xl h-auto min-h-[48px] sm:min-h-[44px]">
          <TabsTrigger
            value="profile"
            className="h-10 sm:h-full rounded-xl text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md cursor-pointer justify-center px-3 py-2"
          >
            <User className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Profile
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="h-10 sm:h-full rounded-xl text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md cursor-pointer justify-center px-3 py-2"
          >
            <SmartphoneDevice className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Bottom Nav
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="h-10 sm:h-full rounded-xl text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md cursor-pointer justify-center px-3 py-2"
          >
            <Shield className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Security
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="h-10 sm:h-full rounded-xl text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md cursor-pointer justify-center px-3 py-2"
          >
            <HistoricShield className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Update your display name and global default currency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md w-full">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Display Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50 border-input/60 rounded-xl text-xs sm:text-sm h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email Address</Label>
                  <Input
                    disabled
                    value={user.email}
                    className="bg-muted/30 border-input/40 rounded-xl text-xs sm:text-sm text-muted-foreground h-10"
                  />
                  <p className="text-[10px] text-muted-foreground">Email cannot be changed directly.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Default Currency</Label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val ?? "USD")}>
                    <SelectTrigger className="bg-background/50 border-input/60 rounded-xl text-xs sm:text-sm h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-5 text-xs sm:text-sm font-medium cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <Spark className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <FloppyDisk className="w-4 h-4 mr-1.5" />
                    )}
                    Save Changes
                  </Button>
                  {profileSuccess && (
                    <span className="text-xs text-emerald-500 font-medium flex items-center justify-center sm:justify-start gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" /> Saved successfully!
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOTTOM NAV CUSTOMIZER TAB */}
        <TabsContent value="appearance" className="space-y-4">
          {/* Live Preview */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <SmartphoneDevice className="w-4 h-4 text-primary" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BottomNavPreview items={safeNavList} centerButtonMode={centerButtonMode} />
            </CardContent>
          </Card>

          {/* Center Button Mode */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Center Button Mode
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Choose what the center button in the bottom navigation does.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Action Button Option */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setCenterButtonMode("action")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setCenterButtonMode("action");
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer select-none",
                  centerButtonMode === "action"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/40 bg-background/50 hover:border-primary/40"
                )}
                id="center-mode-action"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      centerButtonMode === "action" ? "bg-primary" : "bg-muted/50"
                    )}
                  >
                    <Plus
                      className={cn("h-5 w-5", centerButtonMode === "action" ? "text-primary-foreground" : "text-muted-foreground")}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Action Button</p>
                    <p className="text-xs text-muted-foreground">Opens quick-add menu</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setInfoModalMode("action"); }}
                    className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Learn more about Action Button"
                  >
                    <InfoCircle className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                  {centerButtonMode === "action" && (
                    <Check className="h-5 w-5 text-primary" strokeWidth={2.5} />
                  )}
                </div>
              </div>

              {/* Normal Link Option */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setCenterButtonMode("link")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setCenterButtonMode("link");
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer select-none",
                  centerButtonMode === "link"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/40 bg-background/50 hover:border-primary/40"
                )}
                id="center-mode-link"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      centerButtonMode === "link" ? "bg-primary" : "bg-muted/50"
                    )}
                  >
                    <HomeSimple
                      className={cn("h-5 w-5", centerButtonMode === "link" ? "text-primary-foreground" : "text-muted-foreground")}
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Normal Link</p>
                    <p className="text-xs text-muted-foreground">Goes to Dashboard</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setInfoModalMode("link"); }}
                    className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Learn more about Normal Link mode"
                  >
                    <InfoCircle className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                  {centerButtonMode === "link" && (
                    <Check className="h-5 w-5 text-primary" strokeWidth={2.5} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nav Items Order & Toggle */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <SmartphoneDevice className="w-4 h-4 text-primary" /> Navigation Links
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Reorder links and enable/disable shortcuts. Up to 5 visible at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current nav items */}
              <div className="space-y-2">
                {safeNavList.map((item, idx) => {
                  const opt = ALL_NAV_OPTIONS.find(o => o.id === item.id);
                  const IconComp = opt?.IconComp || HomeSimple;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-background/50 border border-border/40 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveNavItem(idx, "up")}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          >
                            <NavArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === safeNavList.length - 1}
                            onClick={() => moveNavItem(idx, "down")}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          >
                            <NavArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center">
                          <IconComp className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
                        </div>
                        <span className="text-xs font-semibold text-foreground capitalize">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground hidden sm:block">
                          {item.enabled ? "Visible" : "Hidden"}
                        </span>
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={() => toggleNavItem(item.id)}
                        />
                        {safeNavList.length > 3 && (
                          <button
                            type="button"
                            onClick={() => removeNavLink(item.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                            aria-label={`Remove ${item.label}`}
                          >
                            <Xmark className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add more links */}
              {availableToAdd.length > 0 && safeNavList.length < 5 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Add more links</p>
                  <div className="flex flex-wrap gap-2">
                    {availableToAdd.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => addNavLink(opt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  onClick={handleSaveNav}
                  disabled={isSavingNav}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-5 text-xs sm:text-sm font-medium cursor-pointer"
                >
                  {isSavingNav ? (
                    <Spark className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <FloppyDisk className="w-4 h-4 mr-1.5" />
                  )}
                  Save Navigation
                </Button>
                {navSuccess && (
                  <span className="text-xs text-emerald-500 font-medium flex items-center justify-center sm:justify-start gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" /> Navigation Updated!
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password Card */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" /> Update Password
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Ensure your account is using a long, random password to stay secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md w-full">
                {passwordMsg?.error && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                    {passwordMsg.error}
                  </div>
                )}
                {passwordMsg?.success && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-medium">
                    {passwordMsg.success}
                  </div>
                )}

                {[
                  { label: "Current Password", value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                  { label: "New Password", value: newPassword, setter: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
                  { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
                ].map(({ label, value, setter, show, toggle }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-xs font-medium">{label}</Label>
                    <div className="relative">
                      <Input
                        type={show ? "text" : "password"}
                        required
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="bg-background/50 border-input/60 rounded-xl text-xs sm:text-sm h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={toggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {show ? <EyeClosed className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-5 text-xs sm:text-sm font-medium cursor-pointer"
                >
                  {isChangingPassword ? (
                    <Spark className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Key className="w-4 h-4 mr-1.5" />
                  )}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Active Device Sessions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                FINCY enforces single-device security. Here are your recorded login sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-background/50 border border-border/40 rounded-xl gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {s.deviceInfo || "Web Browser Session"}
                      </span>
                      {idx === 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/40 text-emerald-500">
                          Current Device
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      IP: {s.ipAddress || "Unknown"} • Last active: {format(parseISO(s.lastSeenAt), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT LOGS TAB */}
        <TabsContent value="audit">
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <HistoricShield className="w-4 h-4 text-primary" /> Security & Activity Logs
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Recent security events, authentications, and state alterations on your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No audit logs recorded yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-background/40 border border-border/30 rounded-xl text-xs gap-1.5"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{log.action}</span>
                        {log.entity && (
                          <span className="text-muted-foreground ml-2">
                            • {log.entity} {log.entityId ? `(#${log.entityId.slice(-4)})` : ""}
                          </span>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          IP: {log.ipAddress || "Localhost"}
                        </p>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground shrink-0 self-start sm:self-auto">
                        {format(parseISO(log.createdAt), "MMM d, HH:mm:ss")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Modal */}
      <InfoModal mode={infoModalMode} onClose={() => setInfoModalMode(null)} />
    </div>
  );
}
