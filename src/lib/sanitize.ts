/**
 * Recursively removes all undefined properties from objects and arrays
 * to prevent Firestore "unsupported field value: undefined" errors.
 */
export function sanitizePayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return null as any;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item)) as any;
  }

  if (typeof input === "object" && !(input instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        cleaned[key] = sanitizePayload(value);
      }
    }
    return cleaned as T;
  }

  return input;
}
