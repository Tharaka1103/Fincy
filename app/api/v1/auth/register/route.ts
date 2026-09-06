import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { authRateLimiter, checkRateLimit } from "@/lib/rate-limiter";
import { writeAuditLog, getIpFromRequest, getUserAgent } from "@/lib/audit";
import { getIpFromRequest as getIp } from "@/lib/audit";

// POST /api/v1/auth/register
export async function POST(request: NextRequest) {
  const ip = getIpFromRequest(request);

  // Rate limit registration
  const { success } = await checkRateLimit(authRateLimiter, `register:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  // Create default bottom nav config
  await prisma.bottomNavConfig.create({
    data: {
      userId: user.id,
      items: [
        { id: "accounts", label: "Accounts", icon: "wallet", href: "/accounts", enabled: true },
        { id: "transactions", label: "Transactions", icon: "arrow-left-right", href: "/transactions", enabled: true },
        { id: "dashboard", label: "Home", icon: "home", href: "/dashboard", enabled: true },
        { id: "analytics", label: "Analytics", icon: "bar-chart-2", href: "/analytics", enabled: true },
        { id: "settings", label: "Settings", icon: "settings", href: "/settings", enabled: true },
      ],
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "REGISTER",
    entity: "User",
    entityId: user.id,
    metadata: { email, method: "credentials" },
    ipAddress: ip,
    userAgent: getUserAgent(request),
  });

  // Send welcome email (non-blocking)
  try {
    const { sendWelcomeEmail } = await import("@/lib/email");
    void sendWelcomeEmail(email, name);
  } catch {
    // Non-blocking
  }

  return NextResponse.json(
    { success: true, user, message: "Account created successfully" },
    { status: 201 }
  );
}
