"use client";

import * as React from "react";
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
  auditLogs: AuditLog[];
  sessions: SessionInfo[];
}

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

export function SettingsClient({
  user,
  initialNavItems,
  auditLogs,
  sessions,
}: SettingsClientProps) {
  // Profile state
  const [name, setName] = React.useState(user.name || "");
  const [currency, setCurrency] = React.useState(user.currency || "USD");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  // Bottom Nav items state
  const [navItems, setNavItems] = React.useState<NavItem[]>(initialNavItems);
  const [isSavingNav, setIsSavingNav] = React.useState(false);
  const [navSuccess, setNavSuccess] = React.useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordMsg, setPasswordMsg] = React.useState<{ error?: string; success?: string } | null>(null);

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
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navItems.length) return;

    const newItems = [...navItems];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setNavItems(newItems);
  };

  const toggleNavItem = (id: string) => {
    setNavItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleSaveNav = async () => {
    setIsSavingNav(true);
    setNavSuccess(false);

    try {
      const res = await fetch("/api/v1/settings/bottom-nav", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: navItems }),
      });

      if (!res.ok) throw new Error("Failed to save bottom navigation");
      setNavSuccess(true);
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
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
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
        <TabsContent value="appearance">
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <SmartphoneDevice className="w-4 h-4 text-primary" /> Mobile Bottom Navigation Editor
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Reorder icons and enable/disable shortcuts in your mobile bottom navigation bar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {navItems.map((item, idx) => (
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
                          disabled={idx === navItems.length - 1}
                          onClick={() => moveNavItem(idx, "down")}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                        >
                          <NavArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-foreground capitalize">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">
                        {item.enabled ? "Visible" : "Hidden"}
                      </span>
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={() => toggleNavItem(item.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>

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
                  Save Bottom Navigation
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
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Current Password</Label>
                  <Input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-background/50 border-input/60 rounded-xl text-xs sm:text-sm h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">New Password</Label>
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-background/50 border-input/60 rounded-xl text-xs sm:text-sm h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Confirm New Password</Label>
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background/50 border-input/60 rounded-xl text-xs sm:text-sm h-10"
                  />
                </div>

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
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
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
    </div>
  );
}
