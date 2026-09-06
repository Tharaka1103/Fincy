import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize a string by stripping HTML/JS injection attempts.
 * Returns a clean string safe for database storage.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
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
