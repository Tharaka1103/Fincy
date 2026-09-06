import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalDepositSchema } from "@/lib/validations/finance";
import { apiRateLimiter, checkRateLimit } from "@/lib/rate-limiter";

type Params = { params: Promise<{ id: string }> };

// POST /api/v1/goals/[id]/deposit
export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimiter, session.user.id);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;
  const goal = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  if (goal.status !== "ACTIVE") {
    return NextResponse.json({ error: "Cannot deposit to a non-active goal" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = goalDepositSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const newAmount = Number(goal.currentAmount) + parsed.data.amount;
  const isCompleted = newAmount >= Number(goal.targetAmount);

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      currentAmount: newAmount,
      status: isCompleted ? "COMPLETED" : "ACTIVE",
    },
  });

  return NextResponse.json({
    ...updated,
    percentage: Math.min(100, Math.round((newAmount / Number(goal.targetAmount)) * 100)),
    isCompleted,
  });
}
