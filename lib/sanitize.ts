/**
 * Sanitize a string by stripping HTML tags, control characters, and injection attempts.
 * Safe for all serverless runtime environments (zero jsdom/browser dependency).
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";

  return input
    // Remove null bytes and dangerous control characters
    .replace(/\0/g, "")
    // Strip HTML tags entirely
    .replace(/<[^>]*>?/gm, "")
    // Remove javascript: pseudo protocol
    .replace(/javascript\s*:/gi, "")
    // Remove vbscript: pseudo protocol
    .replace(/vbscript\s*:/gi, "")
    // Remove on* event handler injection attempts
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) : item
      );
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/**
 * Zod transform for string fields — sanitize + trim
 */
export const sanitizedString = (val: string) => sanitizeString(val);
