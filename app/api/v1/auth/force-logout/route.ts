import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog, getIpFromRequest, getUserAgent } from "@/lib/audit";

/**
 * POST /api/v1/auth/force-logout
 * Invalidates all other active sessions for the current user.
 * Used for single-device enforcement.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Deactivate all sessions for this user
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    await writeAuditLog({
      userId,
      action: "FORCE_LOGOUT",
      entity: "User",
      entityId: userId,
      metadata: { reason: "User forced logout from all other devices" },
      ipAddress: getIpFromRequest(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to force logout" }, { status: 500 });
  }
}

/**
 * GET /api/v1/auth/check-session
 * Check if there's an active session on another device.
 */
export async function GET(request: NextRequest) {
  // This endpoint is checked before login to detect session conflicts
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ hasActiveSession: false });
  }

  const activeSession = await prisma.session.findFirst({
    where: { userId, isActive: true, expires: { gt: new Date() } },
    select: { deviceInfo: true, lastSeenAt: true, ipAddress: true },
  });

  return NextResponse.json({
    hasActiveSession: !!activeSession,
    deviceInfo: activeSession?.deviceInfo ?? null,
    lastSeenAt: activeSession?.lastSeenAt ?? null,
  });
}
