import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAccountSchema } from "@/lib/validations/finance";
import { apiRateLimiter, checkRateLimit } from "@/lib/rate-limiter";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/accounts/[id]
export async function GET(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.financialAccount.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

// PATCH /api/v1/accounts/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimiter, session.user.id);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;
  const existing = await prisma.financialAccount.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { isDefault, ...rest } = parsed.data;

  if (isDefault) {
    await prisma.financialAccount.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.financialAccount.update({
    where: { id },
    data: { ...rest, ...(isDefault !== undefined ? { isDefault } : {}) },
  });

  return NextResponse.json(updated);
}

// DELETE /api/v1/accounts/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.financialAccount.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete (archive) instead of hard delete to preserve transaction history
  await prisma.financialAccount.update({
    where: { id },
    data: { isArchived: true },
  });

  return new NextResponse(null, { status: 204 });
}
