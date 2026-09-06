import * as React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { RemindersClient } from "./client";

export const metadata: Metadata = {
  title: "Reminders & Bills | FINCY",
  description: "Never miss a bill payment or financial milestone again.",
};

export default async function RemindersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const reminders = await prisma.reminder.findMany({
    where: { userId: session.user.id },
    orderBy: { dueDate: "asc" },
  });

  const serializedReminders = reminders.map((r) => ({
    ...r,
    amount: r.amount ? Number(r.amount) : null,
    dueDate: r.dueDate.toISOString(),
    snoozeUntil: r.snoozeUntil ? r.snoozeUntil.toISOString() : null,
    lastNotifiedAt: r.lastNotifiedAt ? r.lastNotifiedAt.toISOString() : null,
  }));

  return (
    <RemindersClient
      initialReminders={serializedReminders}
      currency={session.user.currency || "USD"}
    />
  );
}
