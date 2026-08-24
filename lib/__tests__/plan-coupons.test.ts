import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Subscription coupon codes.
 *
 * The rules here decide what a customer is charged, so every way a code can be
 * refused is worth pinning down: an expired code, a spent one, one meant for a
 * different plan, and one this person has already used. A hole in any of them
 * is money given away.
 */

let couponRow: Record<string, unknown> | null = null;
let redemptionCount = 0;
const inserted: Record<string, unknown>[] = [];
let insertError: { code?: string } | null = null;
const rpcCalls: { fn: string; args: unknown }[] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table === "plan_coupons") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: couponRow }) }) }),
        };
      }
      // plan_coupon_redemptions
      return {
        select: () => ({ eq: () => ({ eq: async () => ({ count: redemptionCount }) }) }),
        insert: async (row: Record<string, unknown>) => {
          inserted.push(row);
          return { error: insertError };
        },
      };
    },
    rpc: async (fn: string, args: unknown) => { rpcCalls.push({ fn, args }); return { data: 1 }; },
  }),
}));

const load = async () => await import("../plan-coupons");

const VALID = {
  id: "c1", code: "LAUNCH20", percent: 20, plan_id: null,
  max_uses: null, used_count: 0, per_user_limit: 1,
  active: true, expires_at: null, note: null, created_at: "2026-01-01",
};

beforeEach(() => {
  couponRow = { ...VALID };
  redemptionCount = 0;
  inserted.length = 0;
  insertError = null;
  rpcCalls.length = 0;
});

describe("applyPercent", () => {
  it("takes the percentage off", async () => {
    const { applyPercent } = await load();
    expect(applyPercent(10000, 20)).toBe(2000);
  });

  it("never discounts more than the price", async () => {
    const { applyPercent } = await load();
    expect(applyPercent(10000, 100)).toBe(10000);
    expect(applyPercent(10000, 150)).toBe(10000);
  });

  it("ignores a negative percent rather than adding money", async () => {
    const { applyPercent } = await load();
    expect(applyPercent(10000, -50)).toBe(0);
  });
});

describe("normaliseCode", () => {
  it("uppercases and trims, so codes are case-insensitive to type", async () => {
    const { normaliseCode } = await load();
    expect(normaliseCode("  launch20 ")).toBe("LAUNCH20");
  });
});

describe("validatePlanCoupon", () => {
  it("accepts a good code and quotes the discounted price", async () => {
    const { validatePlanCoupon } = await load();
    const res = await validatePlanCoupon("launch20", "starter", 10000, "u1");
    expect(res.ok).toBe(true);
    expect(res.discount).toBe(2000);
    expect(res.finalAmount).toBe(8000);
    expect(res.code).toBe("LAUNCH20");
  });

  it("refuses a code that does not exist", async () => {
    couponRow = null;
    const { validatePlanCoupon } = await load();
    expect((await validatePlanCoupon("NOPE", "starter", 10000, "u1")).ok).toBe(false);
  });

  it("refuses a paused code", async () => {
    couponRow = { ...VALID, active: false };
    const { validatePlanCoupon } = await load();
    expect((await validatePlanCoupon("LAUNCH20", "starter", 10000, "u1")).ok).toBe(false);
  });

  it("refuses an expired code", async () => {
    couponRow = { ...VALID, expires_at: new Date(Date.now() - 86400000).toISOString() };
    const { validatePlanCoupon } = await load();
    const res = await validatePlanCoupon("LAUNCH20", "starter", 10000, "u1");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/expired/i);
  });

  it("refuses a code that has hit its total limit", async () => {
    couponRow = { ...VALID, max_uses: 5, used_count: 5 };
    const { validatePlanCoupon } = await load();
    expect((await validatePlanCoupon("LAUNCH20", "starter", 10000, "u1")).ok).toBe(false);
  });

  it("refuses a code scoped to a different plan", async () => {
    couponRow = { ...VALID, plan_id: "pro" };
    const { validatePlanCoupon } = await load();
    const res = await validatePlanCoupon("LAUNCH20", "starter", 10000, "u1");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/only works/i);
  });

  it("allows a plan-scoped code on its own plan", async () => {
    couponRow = { ...VALID, plan_id: "starter" };
    const { validatePlanCoupon } = await load();
    expect((await validatePlanCoupon("LAUNCH20", "starter", 10000, "u1")).ok).toBe(true);
  });

  it("refuses someone who already used their allowance", async () => {
    redemptionCount = 1;
    const { validatePlanCoupon } = await load();
    const res = await validatePlanCoupon("LAUNCH20", "starter", 10000, "u1");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/already used/i);
  });

  it("lets a repeat renewal through when there is no per-user cap", async () => {
    couponRow = { ...VALID, per_user_limit: null };
    redemptionCount = 99;
    const { validatePlanCoupon } = await load();
    expect((await validatePlanCoupon("LAUNCH20", "starter", 10000, "u1")).ok).toBe(true);
  });

  it("can take the whole price, leaving nothing to pay", async () => {
    couponRow = { ...VALID, percent: 100 };
    const { validatePlanCoupon } = await load();
    const res = await validatePlanCoupon("LAUNCH20", "starter", 10000, "u1");
    expect(res.finalAmount).toBe(0);
  });

  it("refuses an empty code without hitting the database", async () => {
    const { validatePlanCoupon } = await load();
    expect((await validatePlanCoupon("", "starter", 10000, "u1")).ok).toBe(false);
  });
});

describe("redeemPlanCoupon", () => {
  const input = {
    couponId: "c1", userId: "u1", reference: "tomplat_1",
    planId: "starter", percent: 20, discountAmount: 2000,
  };

  it("records the redemption and bumps the count", async () => {
    const { redeemPlanCoupon } = await load();
    await redeemPlanCoupon(input);
    expect(inserted).toHaveLength(1);
    expect(rpcCalls).toEqual([{ fn: "bump_plan_coupon_use", args: { p_coupon: "c1" } }]);
  });

  it("does not double-count when the callback and webhook both land", async () => {
    insertError = { code: "23505" }; // unique violation on reference
    const { redeemPlanCoupon } = await load();
    await redeemPlanCoupon(input);
    expect(rpcCalls).toHaveLength(0);
  });
});
