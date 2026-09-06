import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReminderSchema, updateReminderSchema } from "@/lib/validations/finance";
import { apiRateLimiter, checkRateLimit } from "@/lib/rate-limiter";

// GET /api/v1/reminders
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const done = searchParams.get("done");

  const reminders = await prisma.reminder.findMany({
    where: {
      userId: session.user.id,
      ...(done !== null ? { isDone: done === "true" } : {}),
    },
    orderBy: [{ isDone: "asc" }, { dueDate: "asc" }],
  });

  return NextResponse.json(reminders);
}

// POST /api/v1/reminders
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimiter, session.user.id);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = createReminderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const reminder = await prisma.reminder.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      dueDate: new Date(parsed.data.dueDate),
      amount: parsed.data.amount ?? null,
    },
  });

  return NextResponse.json(reminder, { status: 201 });
}
