import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoalSchema, updateGoalSchema } from "@/lib/validations/finance";
import { apiRateLimiter, checkRateLimit } from "@/lib/rate-limiter";

// GET /api/v1/goals
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  // Add progress percentage
  const goalsWithProgress = goals.map((goal) => ({
    ...goal,
    percentage: Math.min(
      100,
      Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
    ),
    remaining: Math.max(0, Number(goal.targetAmount) - Number(goal.currentAmount)),
  }));

  return NextResponse.json(goalsWithProgress);
}

// POST /api/v1/goals
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimiter, session.user.id);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = createGoalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const goal = await prisma.goal.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
