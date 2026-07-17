import { headers } from "next/headers";

/**
 * Lightweight in-memory sliding-window rate limiter for server actions.
 * Per serverless instance (best effort), which is enough to blunt scripted
 * brute-force and credential-stuffing runs against the custom academy auth.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10000) buckets.clear(); // avoid unbounded growth
  return true;
}

export function clientIp(): string {
  const h = headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}
