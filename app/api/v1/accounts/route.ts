import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAccountSchema, updateAccountSchema } from "@/lib/validations/finance";
import { apiRateLimiter, checkRateLimit } from "@/lib/rate-limiter";
import { getIpFromRequest } from "@/lib/audit";

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// GET /api/v1/accounts
export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimiter, userId);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const accounts = await prisma.financialAccount.findMany({
    where: { userId, isArchived: false },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(accounts);
}

// POST /api/v1/accounts
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimiter, userId);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = createAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { isDefault, ...rest } = parsed.data;

  // If setting this account as default, unset other defaults first
  if (isDefault) {
    await prisma.financialAccount.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const account = await prisma.financialAccount.create({
    data: { ...rest, userId, isDefault: isDefault ?? false },
  });

  return NextResponse.json(account, { status: 201 });
}
