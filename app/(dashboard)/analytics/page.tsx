import * as React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import type { Metadata } from "next";
import { AnalyticsClient } from "./client";

export const metadata: Metadata = {
  title: "Analytics | FINCY",
  description: "Deep dive into your financial health, spending patterns and monthly trends.",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const sixMonthsAgo = subMonths(now, 5);
  const startDate = startOfMonth(sixMonthsAgo);

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate },
      },
      include: {
        category: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.category.findMany({
      where: {
        OR: [{ userId: session.user.id }, { isSystem: true }],
      },
    }),
  ]);

  const serializedTransactions = transactions.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    date: t.date.toISOString(),
    categoryId: t.categoryId,
    categoryName: t.category?.name || "Uncategorized",
    categoryColor: t.category?.color || "#94a3b8",
  }));

  return (
    <AnalyticsClient
      transactions={serializedTransactions}
      categories={categories}
      currency={session.user.currency || "USD"}
    />
  );
}
