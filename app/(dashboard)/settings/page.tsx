import * as React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { SettingsClient } from "./client";

export const metadata: Metadata = {
  title: "Settings | FINCY",
  description: "Customize your account, appearance, currencies, bottom navigation, and security.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user, bottomNavConfig, auditLogs, activeSessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        currency: true,
        createdAt: true,
      },
    }),
    prisma.bottomNavConfig.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.auditLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.session.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: { lastSeenAt: "desc" },
    }),
  ]);

  const serializedAuditLogs = auditLogs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  const serializedSessions = activeSessions.map((s) => ({
    ...s,
    expires: s.expires.toISOString(),
    createdAt: s.createdAt.toISOString(),
    lastSeenAt: s.lastSeenAt.toISOString(),
  }));

  return (
    <SettingsClient
      user={user!}
      initialNavItems={
        (bottomNavConfig?.items as any) || [
          { id: "accounts", label: "Accounts", icon: "wallet", href: "/accounts", enabled: true },
          { id: "transactions", label: "Transactions", icon: "arrow-left-right", href: "/transactions", enabled: true },
          { id: "dashboard", label: "Dashboard", icon: "home", href: "/dashboard", enabled: true },
          { id: "analytics", label: "Analytics", icon: "bar-chart-2", href: "/analytics", enabled: true },
          { id: "settings", label: "Settings", icon: "settings", href: "/settings", enabled: true },
        ]
      }
      auditLogs={serializedAuditLogs}
      sessions={serializedSessions}
    />
  );
}
