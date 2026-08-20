import { describe, expect, it } from "vitest";

/**
 * Backdating a sandbox order. The rules matter more than they look: a day that
 * slides across a timezone puts the sale on the wrong bar of the graph, and a
 * future date would draw revenue that has not happened.
 *
 * Mirrors orderTimestamp in the sandbox actions, which cannot be imported here
 * because that module is a "use server" file.
 */
function orderTimestamp(day?: string, now = Date.now()): string | undefined {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const at = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(at.getTime())) return undefined;
  if (at.getTime() > now) return undefined;
  if (at.getTime() < now - 730 * 86_400_000) return undefined;
  return at.toISOString();
}

const DAY = 86_400_000;
const now = Date.parse("2026-08-20T09:00:00.000Z");

describe("backdating a sandbox order", () => {
  it("files a past day at midday UTC, so it cannot slide either side", () => {
    expect(orderTimestamp("2026-08-01", now)).toBe("2026-08-01T12:00:00.000Z");
  });

  it("keeps the chosen day when read back the way the charts read it", () => {
    // The revenue series buckets by the first ten characters of the timestamp.
    expect(orderTimestamp("2026-07-14", now)!.slice(0, 10)).toBe("2026-07-14");
  });

  it("refuses a future date", () => {
    expect(orderTimestamp("2026-09-01", now)).toBeUndefined();
  });

  it("refuses anything older than two years", () => {
    const old = new Date(now - 800 * DAY).toISOString().slice(0, 10);
    expect(orderTimestamp(old, now)).toBeUndefined();
  });

  it("falls back to the database stamp for junk or an empty pick", () => {
    expect(orderTimestamp("", now)).toBeUndefined();
    expect(orderTimestamp("not-a-date", now)).toBeUndefined();
    expect(orderTimestamp("20-08-2026", now)).toBeUndefined();
  });

  it("allows today itself", () => {
    // Midday UTC on the current day is behind a 09:00 "now" only if the clock
    // says so, so today is accepted from midday onwards; earlier in the day the
    // order simply falls back to now, which is still today.
    const todayNoon = orderTimestamp("2026-08-20", Date.parse("2026-08-20T23:00:00.000Z"));
    expect(todayNoon).toBe("2026-08-20T12:00:00.000Z");
  });
});

/**
 * Conversion rate. Sandbox orders are written straight to the database without
 * anyone visiting, so the raw ratio can exceed every visit; a dashboard that
 * says 170% of visits converted is telling an obvious untruth.
 */
function conversionRate(orders: number, visits: number): number {
  return visits > 0 ? Math.min(100, (orders / visits) * 100) : 0;
}

describe("conversion rate", () => {
  it("never exceeds 100, even with more orders than visits", () => {
    expect(conversionRate(17, 10)).toBe(100);
  });

  it("reports the real figure when visits outnumber orders", () => {
    expect(conversionRate(5, 200)).toBe(2.5);
  });

  it("is zero rather than infinite when nothing has been visited", () => {
    expect(conversionRate(3, 0)).toBe(0);
  });
});
