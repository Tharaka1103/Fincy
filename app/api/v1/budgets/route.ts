import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBudgetSchema, updateBudgetSchema } from "@/lib/validations/finance";
import { apiRateLimiter, checkRateLimit } from "@/lib/rate-limiter";

// GET /api/v1/budgets
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  const budgets = await prisma.budget.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate spent amount for each budget this period
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: session.user.id,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: {
            gte: budget.startDate,
            lte: budget.endDate ?? now,
          },
        },
      });

      const spentAmount = Number(spent._sum.amount ?? 0);
      const percentage = Math.round((spentAmount / Number(budget.amount)) * 100);

      return { ...budget, spent: spentAmount, percentage };
    })
  );

  return NextResponse.json(budgetsWithSpent);
}

// POST /api/v1/budgets
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimiter, session.user.id);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = createBudgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const budget = await prisma.budget.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });

  return NextResponse.json(budget, { status: 201 });
}
