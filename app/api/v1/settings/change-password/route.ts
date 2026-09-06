import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { changePasswordSchema } from "@/lib/validations/auth";
import { writeAuditLog, getIpFromRequest, getUserAgent } from "@/lib/audit";
import { strictRateLimiter, checkRateLimit } from "@/lib/rate-limiter";

// POST /api/v1/settings/change-password
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Strict rate limit: 3 per hour
  const { success } = await checkRateLimit(strictRateLimiter, session.user.id + ":pw-change");
  if (!success) {
    return NextResponse.json(
      { error: "Too many password change attempts. Try again in an hour." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) {
    return NextResponse.json(
      { error: "Cannot change password for OAuth accounts" },
      { status: 400 }
    );
  }

  const isCurrentValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!isCurrentValid) {
    await writeAuditLog({
      userId: session.user.id,
      action: "FAILED_LOGIN",
      entity: "User",
      entityId: session.user.id,
      metadata: { reason: "Wrong current password during password change" },
      ipAddress: getIpFromRequest(request),
      userAgent: getUserAgent(request),
    });
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  // Invalidate all other sessions (security measure)
  await prisma.session.updateMany({
    where: { userId: session.user.id },
    data: { isActive: false },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "PASSWORD_CHANGE",
    entity: "User",
    entityId: session.user.id,
    metadata: { allSessionsInvalidated: true },
    ipAddress: getIpFromRequest(request),
    userAgent: getUserAgent(request),
  });

  return NextResponse.json({ success: true, message: "Password changed successfully. Please log in again." });
}
