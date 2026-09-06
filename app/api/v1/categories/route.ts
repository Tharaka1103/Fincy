import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/finance";
import { apiRateLimiter, checkRateLimit } from "@/lib/rate-limiter";

// GET /api/v1/categories
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const categories = await prisma.category.findMany({
    where: {
      AND: [
        { OR: [{ userId: session.user.id }, { isSystem: true }] },
        { isArchived: false },
        ...(type ? [{ OR: [{ type: type as any }, { type: "BOTH" }] }] : []),
      ],
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

// POST /api/v1/categories
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimiter, session.user.id);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const category = await prisma.category.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(category, { status: 201 });
}
