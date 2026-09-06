import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTransactionSchema } from "@/lib/validations/finance";
import { apiRateLimiter, checkRateLimit } from "@/lib/rate-limiter";

// GET /api/v1/transactions
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");
  const type = searchParams.get("type") as any;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");

  const where: any = {
    userId: session.user.id,
    parentId: null, // exclude split children from top-level list
  };

  if (accountId) where.accountId = accountId;
  if (categoryId) where.categoryId = categoryId;
  if (type) where.type = type;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { note: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        account: { select: { id: true, name: true, type: true, color: true } },
        toAccount: { select: { id: true, name: true, type: true } },
        splits: {
          include: {
            category: { select: { id: true, name: true, icon: true, color: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    data: transactions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}

// POST /api/v1/transactions
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimiter, session.user.id);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = createTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Verify account belongs to user
  const account = await prisma.financialAccount.findFirst({
    where: { id: data.accountId, userId: session.user.id },
  });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  // Verify destination account for transfers
  if (data.type === "TRANSFER" && data.toAccountId) {
    const toAccount = await prisma.financialAccount.findFirst({
      where: { id: data.toAccountId, userId: session.user.id },
    });
    if (!toAccount) return NextResponse.json({ error: "Destination account not found" }, { status: 404 });
  }

  // Create transaction and update account balance atomically
  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        userId: session.user.id,
        accountId: data.accountId,
        toAccountId: data.toAccountId ?? null,
        categoryId: data.categoryId ?? null,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        exchangeRate: data.exchangeRate ?? null,
        date: new Date(data.date as string),
        description: data.description ?? null,
        note: data.note ?? null,
        tags: data.tags ?? [],
        isRecurring: data.isRecurring,
        recurringInterval: data.recurringInterval ?? null,
        recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : null,
        isSplit: data.isSplit,
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        account: { select: { id: true, name: true, type: true, color: true } },
      },
    });

    // Update account balance
    const balanceDelta =
      data.type === "INCOME" ? data.amount : -data.amount;

    await tx.financialAccount.update({
      where: { id: data.accountId },
      data: { balance: { increment: balanceDelta } },
    });

    // For transfers, update destination account
    if (data.type === "TRANSFER" && data.toAccountId) {
      await tx.financialAccount.update({
        where: { id: data.toAccountId },
        data: { balance: { increment: data.amount } },
      });
    }

    return created;
  });

  return NextResponse.json(transaction, { status: 201 });
}
