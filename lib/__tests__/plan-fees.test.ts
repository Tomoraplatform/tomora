import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Which fee a merchant's customers pay. Getting this wrong in one direction
 * overcharges a paying merchant's customers; in the other it silently waives
 * Tomora's fee. Both are tested.
 */

let subscription: Record<string, unknown> | null = null;
let subscriptionError: { message: string } | null = null;
let feeRows: Record<string, unknown>[] | null = [];
let feeTableError: { message: string } | null = null;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/creator/money", () => ({ creditPlatform: async () => {}, recordTransaction: async () => {} }));
vi.mock("@/lib/tiktok/events-api", () => ({ sendTikTokEvent: async () => true }));
vi.mock("@/lib/site-cache", () => ({
  revalidateSite: () => {}, revalidateSitesForUser: async () => {},
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table === "plan_fees") {
        return { select: async () => ({ data: feeTableError ? null : feeRows, error: feeTableError }) };
      }
      // subscriptions
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: subscription, error: subscriptionError }) }),
        }),
      };
    },
  }),
}));

const load = async () => await import("../plan-fees");

const FREE_TIERS = [
  { below: 5000, fee: 105 },
  { below: 15000, fee: 200 },
  { below: 30000, fee: 250 },
  { below: 50000, fee: 500 },
  { below: null, fee: 750 },
];

beforeEach(() => {
  vi.resetModules();
  subscription = null;
  subscriptionError = null;
  feeTableError = null;
  // What migration 0050 leaves in plan_fees.
  feeRows = [
    { plan_id: "free", fee_percent: "0", fee_flat: 0, fee_tiers: FREE_TIERS },
    { plan_id: "starter", fee_percent: "0", fee_flat: 0, fee_tiers: null },
    { plan_id: "growth", fee_percent: "0", fee_flat: 0, fee_tiers: null },
    { plan_id: "pro", fee_percent: "0", fee_flat: 0, fee_tiers: null },
  ];
});

describe("feePolicyForOwner", () => {
  it("puts an owner with no subscription on the Free plan: fixed fee by order size, no bank transfer", async () => {
    const { feePolicyForOwner } = await load();
    const p = await feePolicyForOwner("u1");
    expect(p.planId).toBe("free");
    expect(p.rate.tiers).toEqual(FREE_TIERS);
    expect(p.allowBankTransfer).toBe(false);
  });

  it("charges nothing on any paid plan, Starter included", async () => {
    const { feePolicyForOwner } = await load();
    for (const plan of ["starter", "growth", "pro", "onetime", "custom"]) {
      subscription = { status: "active", plan };
      const p = await feePolicyForOwner("u1");
      expect(p.rate, plan).toEqual({ percent: 0, flat: 0 });
      expect(p.allowBankTransfer, plan).toBe(true);
    }
  });

  it("keeps a Starter subscriber from before the launch at 0%", async () => {
    // What migration 0047 writes on every subscription that was already paying.
    subscription = { status: "active", plan: "starter", fee_percent_override: "0", fee_flat_override: 0 };
    const { feePolicyForOwner } = await load();
    const p = await feePolicyForOwner("u1");
    expect(p.rate).toEqual({ percent: 0, flat: 0 });
    expect(p.overridden).toBe(true);
  });

  it("drops a lapsed subscriber to Free, override and all", async () => {
    subscription = { status: "cancelled", plan: "growth", fee_percent_override: 0, fee_flat_override: 0 };
    const { feePolicyForOwner } = await load();
    const p = await feePolicyForOwner("u1");
    expect(p.planId).toBe("free");
    expect(p.rate.tiers).toEqual(FREE_TIERS);
  });

  it("treats an expired comp as Free", async () => {
    subscription = { status: "active", plan: "starter", comp_expires_at: "2020-01-01T00:00:00Z" };
    const { feePolicyForOwner } = await load();
    expect((await feePolicyForOwner("u1")).planId).toBe("free");
  });

  it("uses the fees in plan_fees over the config, which is how fees change without a redeploy", async () => {
    feeRows = [{ plan_id: "free", fee_percent: "0", fee_flat: 0, fee_tiers: [{ below: 10000, fee: 150 }, { below: null, fee: 600 }] }];
    const { feePolicyForOwner } = await load();
    expect((await feePolicyForOwner("u1")).rate.tiers).toEqual([{ below: 10000, fee: 150 }, { below: null, fee: 600 }]);
  });

  it("still reads a percentage row that has no bands", async () => {
    feeRows = [{ plan_id: "free", fee_percent: "2.5", fee_flat: 50, fee_tiers: null }];
    const { feePolicyForOwner } = await load();
    expect((await feePolicyForOwner("u1")).rate).toEqual({ percent: 2.5, flat: 50 });
  });

  it("ignores a fee schedule nobody could have meant, and keeps the default bands", async () => {
    // Limits going down, and no open band at the end.
    feeRows = [{ plan_id: "free", fee_percent: "0", fee_flat: 0, fee_tiers: [{ below: 50000, fee: 500 }, { below: 5000, fee: 105 }] }];
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { feePolicyForOwner } = await load();
    expect((await feePolicyForOwner("u1")).rate.tiers).toEqual(FREE_TIERS);
    errors.mockRestore();
  });

  it("ignores a percentage row nobody could have meant, and keeps the default", async () => {
    feeRows = [{ plan_id: "free", fee_percent: "30", fee_flat: 75 }];
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { feePolicyForOwner } = await load();
    expect((await feePolicyForOwner("u1")).rate.tiers).toEqual(FREE_TIERS);
    errors.mockRestore();
  });

  it("charges nothing and allows transfer until the migration has run", async () => {
    feeTableError = { message: 'relation "plan_fees" does not exist' };
    const { feePolicyForOwner } = await load();
    const p = await feePolicyForOwner("u1");
    expect(p.rate).toEqual({ percent: 0, flat: 0 });
    expect(p.allowBankTransfer).toBe(true);
  });

  it("refuses to guess when the subscription cannot be read", async () => {
    subscriptionError = { message: "timeout" };
    const { feePolicyForOwner } = await load();
    await expect(feePolicyForOwner("u1")).rejects.toThrow(/plan/);
  });
});
