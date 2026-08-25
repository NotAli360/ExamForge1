// Minimal in-memory sliding-window rate limiter for the expensive
// AI-backed routes (exam generation, regeneration, chat). No new dependency
// added - this is intentionally simple, matching "don't overengineer".
//
// NOTE: in-memory means limits reset on server restart and aren't shared
// across multiple backend instances. Fine for a single-process deployment;
// swap for a Redis-backed limiter if you scale horizontally.

const buckets = new Map(); // key -> array of timestamps (ms)

export function rateLimit({ windowMs, max, keyFn }) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.user?._id?.toString() || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = (buckets.get(key) || []).filter((t) => t > windowStart);
    if (timestamps.length >= max) {
      return res.status(429).json({
        error: "You're generating requests too quickly. Please wait a moment and try again.",
      });
    }

    timestamps.push(now);
    buckets.set(key, timestamps);
    next();
  };
}

// Periodically sweep old entries so the map doesn't grow unbounded.
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [key, timestamps] of buckets.entries()) {
    const fresh = timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}, 5 * 60 * 1000).unref();
