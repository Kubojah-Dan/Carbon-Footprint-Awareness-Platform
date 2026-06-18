interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitRecord>();

/**
 * Checks if a request key (IP, user ID, etc.) has exceeded the limit in the given window.
 *
 * @param key Unique identifier for the client (IP or User UID)
 * @param limit Maximum number of requests allowed in the window (default 100)
 * @param windowMs Time window size in milliseconds (default 1 hour = 3600000 ms)
 * @returns Rate limit status containing remaining and reset timestamp
 */
export function isRateLimited(
  key: string,
  limit = 100,
  windowMs = 3600000
): {
  limited: boolean;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const record = cache.get(key);

  if (!record) {
    const newRecord = { count: 1, resetTime: now + windowMs };
    cache.set(key, newRecord);
    return { limited: false, remaining: limit - 1, reset: newRecord.resetTime };
  }

  // If window has passed, reset the bucket
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return { limited: false, remaining: limit - 1, reset: record.resetTime };
  }

  if (record.count >= limit) {
    return { limited: true, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { limited: false, remaining: limit - record.count, reset: record.resetTime };
}

/**
 * Standard utility to clean up expired cache entries periodically to avoid memory leaks.
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      if (now > record.resetTime) {
        cache.delete(key);
      }
    }
  }, 300000); // Clean up every 5 minutes
}
