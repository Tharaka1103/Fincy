import { Redis } from "@upstash/redis";

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured = Boolean(
  upstashUrl &&
    upstashToken &&
    !upstashUrl.includes("your_upstash_url") &&
    !upstashUrl.includes("example.com") &&
    upstashUrl.startsWith("https://")
);

export const redis: Redis | null = isConfigured
  ? new Redis({
      url: upstashUrl!,
      token: upstashToken!,
    })
  : null;

// Blocked IPs set key
export const BLOCKED_IPS_KEY = "fincy:blocked_ips";

/**
 * Check if an IP address is blocked
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!redis) return false;
  try {
    return (await redis.sismember(BLOCKED_IPS_KEY, ip)) === 1;
  } catch (err) {
    console.warn("[Redis] Failed to check blocked IP:", err);
    return false;
  }
}

/**
 * Block an IP address permanently
 */
export async function blockIp(ip: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.sadd(BLOCKED_IPS_KEY, ip);
  } catch (err) {
    console.warn("[Redis] Failed to block IP:", err);
  }
}

/**
 * Unblock an IP address
 */
export async function unblockIp(ip: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.srem(BLOCKED_IPS_KEY, ip);
  } catch (err) {
    console.warn("[Redis] Failed to unblock IP:", err);
  }
}

/**
 * Store a value with optional expiry (seconds)
 */
export async function setCache<T>(
  key: string,
  value: T,
  exSeconds?: number
): Promise<void> {
  if (!redis) return;
  try {
    if (exSeconds) {
      await redis.set(key, JSON.stringify(value), { ex: exSeconds });
    } else {
      await redis.set(key, JSON.stringify(value));
    }
  } catch (err) {
    console.warn("[Redis] Failed to set cache:", err);
  }
}

/**
 * Get a cached value
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const val = await redis.get<string>(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  } catch (err) {
    console.warn("[Redis] Failed to get cache:", err);
    return null;
  }
}

/**
 * Delete a cached key
 */
export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn("[Redis] Failed to delete cache:", err);
  }
}
