import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, eachMonthOfInterval, format, subMonths } from "date-fns";

// GET /api/v1/analytics/trends
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const months = Math.min(12, Math.max(1, parseInt(searchParams.get("months") ?? "6")));

  const now = new Date();
  const monthsData = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const from = startOfMonth(date);
    const to = endOfMonth(date);

    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: session.user.id, type: "INCOME", date: { gte: from, lte: to } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: session.user.id, type: "EXPENSE", date: { gte: from, lte: to } },
      }),
    ]);

    monthsData.push({
      month: format(date, "MMM yyyy"),
      monthShort: format(date, "MMM"),
      income: Number(income._sum.amount ?? 0),
      expense: Number(expense._sum.amount ?? 0),
      net: Number(income._sum.amount ?? 0) - Number(expense._sum.amount ?? 0),
    });
  }

  return NextResponse.json(monthsData);
}
