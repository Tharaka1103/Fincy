import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Routes that require authentication
const protectedPaths = [
  "/dashboard",
  "/accounts",
  "/transactions",
  "/analytics",
  "/budget",
  "/reminders",
  "/goals",
  "/reports",
  "/settings",
  "/api/v1",
];

// Routes that should redirect authenticated users to dashboard
const authPaths = ["/login", "/register", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── IP Blocking ──────────────────────────────────────────
  // We do this in Edge-compatible way without importing Node modules
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Skip blocking check for static assets
  if (
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/public") &&
    !pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    // Check blocked IPs via Redis (only for non-static routes)
    try {
      const blockCheckUrl = `${process.env.UPSTASH_REDIS_REST_URL}/sismember/fincy:blocked_ips/${ip}`;
      const blockRes = await fetch(blockCheckUrl, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      });
      if (blockRes.ok) {
        const data: any = await blockRes.json();
        if (data?.result === 1) {
          return new NextResponse("Access Denied", { status: 403 });
        }
      }
    } catch {
      // Redis unavailable — fail open (don't block legitimate users)
    }
  }

  // ── Rate Limiting (auth routes only in proxy) ─────────────
  const isAuthApiRoute =
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/v1/auth/force-logout";

  if (isAuthApiRoute && request.method === "POST") {
    try {
      const rateLimitUrl = `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`;
      // We use a simple counter with INCR + EXPIRE for edge-compatible rate limiting
      const key = `fincy:rl:edge:${ip}`;
      const pipelineBody = JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, 900], // 15 minutes
      ]);
      const rlRes = await fetch(rateLimitUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: pipelineBody,
      });
      if (rlRes.ok) {
        const results: any = await rlRes.json();
        const count = results?.[0]?.result ?? 0;
        if (count > 10) {
          // More than 10 auth attempts in 15 minutes from same IP
          return new NextResponse(
            JSON.stringify({ error: "Too many requests. Please try again later.", code: "RATE_LIMITED" }),
            { status: 429, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    } catch {
      // Fail open
    }
  }

  // ── Auth Protection ──────────────────────────────────────
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth();

  if (isProtected && !session) {
    // API routes return JSON 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    // Page routes redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && session) {
    // Already logged in — redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Add security headers ─────────────────────────────────
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
