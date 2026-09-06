import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTransactionSchema } from "@/lib/validations/finance";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tx = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
    include: {
      category: true,
      account: true,
      toAccount: true,
      splits: { include: { category: true } },
    },
  });

  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tx);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = updateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Recalculate balance delta if amount or type changed
  const updated = await prisma.$transaction(async (tx) => {
    // Reverse old balance effect
    const oldDelta =
      existing.type === "INCOME"
        ? -Number(existing.amount)
        : Number(existing.amount);

    if (data.amount !== undefined || data.type !== undefined) {
      await tx.financialAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: oldDelta } },
      });
    }

    const updatedTx = await tx.transaction.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date as string) : undefined,
        recurringEndDate: data.recurringEndDate
          ? new Date(data.recurringEndDate)
          : undefined,
      },
      include: {
        category: true,
        account: true,
      },
    });

    // Apply new balance effect
    const newType = data.type ?? existing.type;
    const newAmount = data.amount ?? Number(existing.amount);
    const newDelta = newType === "INCOME" ? newAmount : -newAmount;

    if (data.amount !== undefined || data.type !== undefined) {
      await tx.financialAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: newDelta } },
      });
    }

    return updatedTx;
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Delete splits first
    await tx.transaction.deleteMany({ where: { parentId: id } });
    await tx.transaction.delete({ where: { id } });

    // Reverse balance effect
    const delta =
      existing.type === "INCOME"
        ? -Number(existing.amount)
        : Number(existing.amount);

    await tx.financialAccount.update({
      where: { id: existing.accountId },
      data: { balance: { increment: delta } },
    });
  });

  return new NextResponse(null, { status: 204 });
}
