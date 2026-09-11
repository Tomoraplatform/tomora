import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Booking Tomora's fee once a payment lands, and checking it against what
 * Paystack says it actually split.
 */

let charge: Record<string, any> | null = null;
let split: { integration: number | null; subaccount: number | null; paystack: number | null } | undefined;
const credits: Record<string, any>[] = [];
const chargeUpdates: Record<string, any>[] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/lib/creator/money", () => ({
  creditPlatform: async (c: Record<string, any>) => { credits.push(c); },
  recordTransaction: async () => {},
}));
vi.mock("@/lib/paystack", () => ({
  verifyTransaction: async () => ({ success: true, amountNaira: 10_375, split }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: charge }) }) }),
      update: (u: Record<string, any>) => { chargeUpdates.push(u); return { eq: async () => ({ error: null }) }; },
    }),
  }),
}));

const load = async () => await import("../payment-charges");

beforeEach(() => {
  vi.resetModules();
  credits.length = 0;
  chargeUpdates.length = 0;
  charge = {
    reference: "tom_1", kind: "order", subtotal: 10_000, platform_fee: 375,
    passthrough_fee: 0, total_charged: 10_375, status: "pending",
  };
  split = { integration: 375, subaccount: 9_744.37, paystack: 255.63 };
});

describe("settlePaymentCharge", () => {
  it("books the fee to Tomora's wallet as transaction_fee revenue", async () => {
    const { settlePaymentCharge } = await load();
    await settlePaymentCharge("tom_1");
    expect(credits).toEqual([expect.objectContaining({ source: "transaction_fee", amount: 375, reference: "tom_1" })]);
  });

  it("stores Paystack's own account of the split, for checking in test mode", async () => {
    const { settlePaymentCharge } = await load();
    await settlePaymentCharge("tom_1");
    expect(chargeUpdates[0]).toMatchObject({
      status: "paid", split_integration: 375, split_subaccount: 9_744.37, split_paystack: 255.63,
    });
  });

  it("says so when Paystack paid Tomora something other than the fee", async () => {
    split = { integration: 300, subaccount: 9_819.37, paystack: 255.63 };
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { settlePaymentCharge } = await load();
    await settlePaymentCharge("tom_1");
    expect(errors).toHaveBeenCalledWith(expect.stringMatching(/should have received ₦375/));
    errors.mockRestore();
  });

  it("books nothing twice", async () => {
    charge!.status = "paid";
    const { settlePaymentCharge } = await load();
    await settlePaymentCharge("tom_1");
    expect(credits).toHaveLength(0);
    expect(chargeUpdates).toHaveLength(0);
  });

  it("books nothing for a fee-free payment, and nothing at all for one with no record", async () => {
    charge!.platform_fee = 0;
    const { settlePaymentCharge } = await load();
    await settlePaymentCharge("tom_1");
    expect(credits).toHaveLength(0);

    charge = null;
    expect(await settlePaymentCharge("tom_old")).toBeNull();
  });
});
