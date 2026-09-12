import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * What happens when a paid plan ends.
 *
 * It used to take every one of the user's websites offline, which is how
 * Tomora ended up with a list of dark sites and owners who had given up. Now
 * the Free plan catches them: the primary site stays online with Free's
 * limits, and only the extra sites a paid plan allowed are closed. A custom
 * domain is never touched, so a site on its own address keeps answering there.
 */

let siteRows: Record<string, any>[] = [];
let subscriptionRow: Record<string, unknown> | null = null;
const updates: { table: string; payload: Record<string, unknown>; where: string[] }[] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/creator/money", () => ({ creditPlatform: async () => {}, recordTransaction: async () => {} }));
vi.mock("@/lib/tiktok/events-api", () => ({ sendTikTokEvent: async () => true }));
vi.mock("@/lib/plan-coupons", () => ({ redeemPlanCoupon: async () => {} }));
vi.mock("@/lib/site-cache", () => ({
  revalidateSite: () => {}, revalidateSitesForUser: async () => {}, siteTag: () => "", siteLookupTag: () => "",
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      const where: string[] = [];
      const chain: any = {
        select: () => chain,
        eq: (col: string, val: unknown) => { where.push(`${col}=${String(val)}`); return chain; },
        in: (col: string, vals: unknown[]) => { where.push(`${col} in ${JSON.stringify(vals)}`); return chain; },
        order: async () => ({ data: table === "sites" ? siteRows : null }),
        maybeSingle: async () => ({ data: table === "subscriptions" ? subscriptionRow : null }),
        update: (payload: Record<string, unknown>) => {
          const rec = { table, payload, where };
          const after: any = {
            eq: (col: string, val: unknown) => { where.push(`${col}=${String(val)}`); updates.push(rec); return Promise.resolve({ error: null }); },
            in: (col: string, vals: unknown[]) => { where.push(`${col} in ${JSON.stringify(vals)}`); updates.push(rec); return Promise.resolve({ error: null }); },
          };
          return after;
        },
        insert: async () => ({ error: null }),
      };
      return chain;
    },
  }),
}));

const load = async () => await import("../billing");

const day = 86_400_000;
beforeEach(() => {
  vi.resetModules();
  updates.length = 0;
  subscriptionRow = null;
  siteRows = [
    { id: "primary", is_live: true, is_demo: false, created_at: "2026-01-01T00:00:00Z" },
    { id: "second", is_live: true, is_demo: false, created_at: "2026-02-01T00:00:00Z" },
    { id: "demo", is_live: true, is_demo: true, created_at: "2026-03-01T00:00:00Z" },
  ];
});

/** Ids a run took offline. */
const closed = () =>
  updates.filter((u) => u.table === "sites" && u.payload.is_live === false)
    .flatMap((u) => u.where.join(" "));

describe("downgradeToFree", () => {
  it("keeps the primary site online and closes only the extra ones", async () => {
    const { downgradeToFree } = await load();
    const res = await downgradeToFree("user-1");

    expect(res.kept).toBe("primary");
    expect(res.tookOffline).toBe(1);
    const offline = closed().join(" ");
    expect(offline).toContain("second");
    expect(offline).not.toContain("primary");
  });

  it("leaves a sandbox demo store alone: it takes no real money", async () => {
    const { downgradeToFree } = await load();
    await downgradeToFree("user-1");
    expect(closed().join(" ")).not.toContain("demo");
  });

  it("does not republish a site the owner took down themselves", async () => {
    siteRows = [{ id: "primary", is_live: false, is_demo: false, created_at: "2026-01-01T00:00:00Z" }];
    const { downgradeToFree } = await load();
    await downgradeToFree("user-1");
    expect(updates.filter((u) => u.payload.is_live === true)).toHaveLength(0);
  });

  it("brings the primary site back when an admin asks for it", async () => {
    siteRows = [
      { id: "primary", is_live: false, is_demo: false, created_at: "2026-01-01T00:00:00Z" },
      { id: "second", is_live: true, is_demo: false, created_at: "2026-02-01T00:00:00Z" },
    ];
    const { downgradeToFree } = await load();
    const res = await downgradeToFree("user-1", { publishPrimary: true });

    const published = updates.find((u) => u.payload.is_live === true);
    expect(published?.where.join(" ")).toContain("primary");
    expect(res.tookOffline).toBe(1);
  });

  it("copes with an account that has no site", async () => {
    siteRows = [];
    const { downgradeToFree } = await load();
    expect(await downgradeToFree("user-1")).toEqual({ kept: null, tookOffline: 0 });
  });
});

describe("when a subscription ends", () => {
  it("a failed payment inside the grace period changes nothing but the status", async () => {
    subscriptionRow = { id: "s1", last_payment_date: new Date(Date.now() - 2 * day).toISOString() };
    const { applyPaymentFailure } = await load();
    await applyPaymentFailure("user-1");

    expect(updates.find((u) => u.table === "subscriptions")?.payload.status).toBe("past_due");
    expect(updates.filter((u) => u.table === "sites")).toHaveLength(0);
  });

  it("a failed payment past the grace period drops them to Free, site still up", async () => {
    subscriptionRow = { id: "s1", last_payment_date: new Date(Date.now() - 60 * day).toISOString() };
    const { applyPaymentFailure } = await load();
    await applyPaymentFailure("user-1");

    const offline = closed().join(" ");
    expect(offline).toContain("second");
    expect(offline).not.toContain("primary");
  });

  it("cancelling does the same, rather than taking everything down", async () => {
    const { disableSubscription } = await load();
    await disableSubscription("user-1");

    expect(updates.find((u) => u.table === "subscriptions")?.payload.status).toBe("cancelled");
    expect(closed().join(" ")).not.toContain("primary");
  });

  it("an expired comp does the same", async () => {
    const { expireCompIfDue } = await load();
    const did = await expireCompIfDue("user-1", { status: "active", comp_expires_at: "2020-01-01T00:00:00Z" });

    expect(did).toBe(true);
    expect(closed().join(" ")).not.toContain("primary");
  });
});
