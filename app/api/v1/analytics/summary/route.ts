import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";

// GET /api/v1/analytics/summary
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : startOfMonth(new Date());
  const to = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : endOfMonth(new Date());

  const [incomeAgg, expenseAgg, prevIncomeAgg, prevExpenseAgg, accounts] = await Promise.all([
    // This month income
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId: session.user.id,
        type: "INCOME",
        date: { gte: from, lte: to },
      },
    }),
    // This month expense
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId: session.user.id,
        type: "EXPENSE",
        date: { gte: from, lte: to },
      },
    }),
    // Previous month income (for comparison)
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId: session.user.id,
        type: "INCOME",
        date: {
          gte: startOfMonth(subMonths(from, 1)),
          lte: endOfMonth(subMonths(from, 1)),
        },
      },
    }),
    // Previous month expense
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId: session.user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth(subMonths(from, 1)),
          lte: endOfMonth(subMonths(from, 1)),
        },
      },
    }),
    // Total balance across all active accounts
    prisma.financialAccount.findMany({
      where: { userId: session.user.id, isArchived: false },
      select: { balance: true, currency: true },
    }),
  ]);

  const income = Number(incomeAgg._sum.amount ?? 0);
  const expense = Number(expenseAgg._sum.amount ?? 0);
  const prevIncome = Number(prevIncomeAgg._sum.amount ?? 0);
  const prevExpense = Number(prevExpenseAgg._sum.amount ?? 0);
  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return NextResponse.json({
    income,
    expense,
    net: income - expense,
    totalBalance,
    changes: {
      income: prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0,
      expense: prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0,
    },
    period: { from: from.toISOString(), to: to.toISOString() },
  });
}
