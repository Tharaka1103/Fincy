import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Auth endpoints: 5 requests per 15 minutes per IP
 * Used for: login, register, forgot-password
 */
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "fincy:rl:auth",
    })
  : null;

/**
 * API endpoints: 100 requests per minute per user/IP
 */
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "fincy:rl:api",
    })
  : null;

/**
 * Strict limiter for sensitive operations (password change, etc.): 3 per hour
 */
export const strictRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 h"),
      analytics: true,
      prefix: "fincy:rl:strict",
    })
  : null;

/**
 * Check rate limit and return result with graceful fail-open
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!limiter) {
    // If Redis is not configured, allow request (development / fallback)
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    // Fail-open on network/Redis error so users are not blocked
    console.warn("[RateLimiter] Error evaluating rate limit, failing open:", err);
    return {
      success: true,
      limit: 100,
      remaining: 100,
      reset: Date.now() + 60000,
    };
  }
}
