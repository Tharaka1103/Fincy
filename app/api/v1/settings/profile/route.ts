import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/finance";
import { writeAuditLog, getIpFromRequest, getUserAgent } from "@/lib/audit";
import { strictRateLimiter, checkRateLimit } from "@/lib/rate-limiter";

// GET /api/v1/settings/profile
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      currency: true,
      locale: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/v1/settings/profile
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(strictRateLimiter, session.user.id + ":profile");
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      currency: true,
      locale: true,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "SETTINGS_CHANGE",
    entity: "User",
    entityId: session.user.id,
    metadata: { changed: Object.keys(parsed.data) },
    ipAddress: getIpFromRequest(request),
    userAgent: getUserAgent(request),
  });

  return NextResponse.json(updated);
}
