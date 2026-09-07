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

  // Items are stored as JSON; centerButtonMode is stored in the config as a separate field
  // We use a wrapper approach: { items: [...], centerButtonMode: "link"|"action" }
  const rawItems = config?.items as any;
  const items = Array.isArray(rawItems) ? rawItems : (rawItems?.items ?? defaultItems);
  const centerButtonMode = rawItems?.centerButtonMode ?? "link";

  return NextResponse.json({ items, centerButtonMode });
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

  // Store as a wrapper object: { items: [...], centerButtonMode: "..." }
  const storedData = {
    items: parsed.data.items,
    centerButtonMode: parsed.data.centerButtonMode ?? "link",
  };

  const config = await prisma.bottomNavConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, items: storedData as any },
    update: { items: storedData as any },
  });

  return NextResponse.json({ items: parsed.data.items, centerButtonMode: parsed.data.centerButtonMode ?? "link" });
}
