import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

// GET /api/v1/analytics/by-category
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
  const type = (searchParams.get("type") ?? "EXPENSE") as "INCOME" | "EXPENSE";

  const transactions = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    _count: { id: true },
    where: {
      userId: session.user.id,
      type,
      date: { gte: from, lte: to },
    },
  });

  // Get category details
  const categoryIds = transactions
    .map((t) => t.categoryId)
    .filter(Boolean) as string[];

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, icon: true, color: true },
  });

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const totalAmount = transactions.reduce(
    (sum, t) => sum + Number(t._sum.amount ?? 0),
    0
  );

  const result = transactions
    .map((t) => ({
      categoryId: t.categoryId,
      category: t.categoryId ? catMap[t.categoryId] ?? null : null,
      amount: Number(t._sum.amount ?? 0),
      count: t._count.id,
      percentage:
        totalAmount > 0
          ? Math.round((Number(t._sum.amount ?? 0) / totalAmount) * 100)
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json(result);
}
