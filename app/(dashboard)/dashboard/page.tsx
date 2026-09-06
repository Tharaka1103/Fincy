import * as React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import type { Metadata } from "next";
import { DashboardClient } from "./client";

export const metadata: Metadata = { title: "Dashboard | FINCY" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  // Parallel data fetching
  const [userProfile, accounts, incomeAgg, expenseAgg, prevExpenseAgg, recentTxs, upcomingReminders, budgets] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, currency: true },
      }),
      prisma.financialAccount.findMany({
        where: { userId, isArchived: false },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId, type: "INCOME", date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId, type: "EXPENSE", date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId, type: "EXPENSE", date: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
      prisma.transaction.findMany({
        where: { userId, parentId: null },
        include: {
          category: { select: { name: true, icon: true, color: true } },
          account: { select: { name: true } },
        },
        orderBy: { date: "desc" },
        take: 5,
      }),
      prisma.reminder.findMany({
        where: { userId, isDone: false, dueDate: { gte: now } },
        orderBy: { dueDate: "asc" },
        take: 3,
      }),
      prisma.budget.findMany({
        where: { userId, isActive: true },
        include: { category: { select: { name: true, icon: true, color: true } } },
        take: 4,
      }),
    ]);

  const income = Number(incomeAgg._sum.amount ?? 0);
  const expense = Number(expenseAgg._sum.amount ?? 0);
  const prevExpense = Number(prevExpenseAgg._sum.amount ?? 0);
  const totalBalance = accounts.reduce((sum: number, acc: { balance: any; }) => sum + Number(acc.balance), 0);

  // Compute budget spending
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (b: { categoryId: any; startDate: any; endDate: any; amount: any; }) => {
      const agg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          categoryId: b.categoryId,
          type: "EXPENSE",
          date: { gte: b.startDate, lte: b.endDate ?? monthEnd },
        },
      });
      const spent = Number(agg._sum.amount ?? 0);
      const budgetAmount = Number(b.amount);
      return {
        ...b,
        amount: budgetAmount,
        spent,
        percentage: budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 100)) : 0,
      };
    })
  );

  const expenseChange =
    prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;

  return (
    <DashboardClient
      user={{
        name: userProfile?.name || session.user.name || "there",
        currency: userProfile?.currency || "USD",
      }}
      accounts={accounts.map((a: { id: any; name: any; type: any; balance: any; currency: any; color: any; icon: any; isDefault: any; }) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
        currency: a.currency,
        color: a.color,
        icon: a.icon,
        isDefault: a.isDefault,
      }))}
      summary={{
        totalBalance,
        income,
        expense,
        net: income - expense,
        expenseChange,
        month: format(now, "MMMM yyyy"),
      }}
      recentTransactions={recentTxs.map((tx: { id: any; type: any; amount: any; currency: any; description: any; date: { toISOString: () => any; }; category: any; account: { name: any; }; }) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        currency: tx.currency,
        description: tx.description ?? "",
        date: tx.date.toISOString(),
        category: tx.category,
        accountName: tx.account.name,
      }))}
      upcomingReminders={upcomingReminders.map((r: { id: any; title: any; dueDate: { toISOString: () => any; }; amount: any; }) => ({
        id: r.id,
        title: r.title,
        dueDate: r.dueDate.toISOString(),
        amount: r.amount ? Number(r.amount) : null,
      }))}
      budgets={budgetsWithSpent.map((b) => ({
        id: b.id,
        name: b.name,
        amount: b.amount,
        spent: b.spent,
        percentage: b.percentage,
        alertAt: b.alertAt,
        category: {
          name: b.category.name,
          icon: b.category.icon,
          color: b.category.color,
        },
      }))}
    />
  );
}
