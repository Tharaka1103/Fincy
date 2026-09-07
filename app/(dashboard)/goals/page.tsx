import * as React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { GoalsClient } from "./client";

export const metadata: Metadata = {
  title: "Savings Goals | FINCY",
  description: "Set financial targets, track your progress and achieve your dreams.",
};

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [goals, accounts] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.financialAccount.findMany({
      where: { userId: session.user.id, isArchived: false },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
  ]);

  const serializedGoals = goals.map((g) => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    deadline: g.deadline ? g.deadline.toISOString() : null,
  }));

  const serializedAccounts = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    balance: Number(a.balance),
  }));

  return (
    <GoalsClient
      initialGoals={serializedGoals}
      accounts={serializedAccounts}
      currency={session.user.currency || "USD"}
    />
  );
}
