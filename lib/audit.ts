import { prisma } from "./prisma";

type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_LOGIN"
  | "REGISTER"
  | "PASSWORD_CHANGE"
  | "SETTINGS_CHANGE"
  | "CSV_EXPORT"
  | "ACCOUNT_CREATED"
  | "FORCE_LOGOUT"
  | "SESSION_INVALIDATED"
  | "EMAIL_CHANGE";

interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write an audit log entry to the database.
 * This is fire-and-forget — it does not block the request.
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        metadata: (params.metadata as any) ?? {},
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    // Never let audit logging break the main request flow
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}

/**
 * Extract IP address from request headers.
 * Handles Vercel, Cloudflare, and direct connections.
 */
export function getIpFromRequest(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Extract user agent from request headers.
 */
export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") ?? "unknown";
}
