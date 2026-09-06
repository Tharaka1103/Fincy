import * as React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import type { Metadata } from "next";
import { BudgetClient } from "./client";

export const metadata: Metadata = {
  title: "Budgets | FINCY",
  description: "Set, manage and track category spending limits.",
};

export default async function BudgetPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [budgets, categories, currentMonthExpenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: session.user.id, isActive: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: {
        OR: [{ userId: session.user.id }, { isSystem: true }],
        isArchived: false,
      },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: "EXPENSE",
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
  ]);

  // Compute spent per category
  const spentByCat: Record<string, number> = {};
  currentMonthExpenses.forEach((tx) => {
    if (tx.categoryId) {
      spentByCat[tx.categoryId] = (spentByCat[tx.categoryId] || 0) + Number(tx.amount);
    }
  });

  const serializedBudgets = budgets.map((b) => ({
    id: b.id,
    name: b.name,
    amount: Number(b.amount),
    spent: spentByCat[b.categoryId] || 0,
    period: b.period,
    alertAt: b.alertAt,
    categoryId: b.categoryId,
    category: {
      id: b.category.id,
      name: b.category.name,
      icon: b.category.icon,
      color: b.category.color,
    },
  }));

  return (
    <BudgetClient
      initialBudgets={serializedBudgets}
      categories={categories}
      currency={session.user.currency || "USD"}
    />
  );
}
