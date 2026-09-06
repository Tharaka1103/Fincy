import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBottomNavSchema } from "@/lib/validations/finance";

// GET /api/v1/settings/bottom-nav
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.bottomNavConfig.findUnique({
    where: { userId: session.user.id },
  });

  const defaultItems = [
    { id: "accounts", label: "Accounts", icon: "wallet", href: "/accounts", enabled: true },
    { id: "transactions", label: "Transactions", icon: "arrow-left-right", href: "/transactions", enabled: true },
    { id: "dashboard", label: "Home", icon: "home", href: "/dashboard", enabled: true },
    { id: "analytics", label: "Analytics", icon: "bar-chart-2", href: "/analytics", enabled: true },
    { id: "settings", label: "Settings", icon: "settings", href: "/settings", enabled: true },
  ];

  return NextResponse.json({ items: config?.items ?? defaultItems });
}

// PUT /api/v1/settings/bottom-nav
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateBottomNavSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const config = await prisma.bottomNavConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, items: parsed.data.items },
    update: { items: parsed.data.items },
  });

  return NextResponse.json({ items: config.items });
}
