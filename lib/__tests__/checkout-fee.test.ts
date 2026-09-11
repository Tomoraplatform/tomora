import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * What storefront checkout and donations send to Paystack.
 *
 * The contract: the customer is charged subtotal + fee; the fee goes to
 * Tomora's main account as `transaction_charge`; the merchant's subaccount
 * still takes the payment with `bearer: "subaccount"`, exactly as before; and
 * the order or donation Tomora records is the subtotal, never the fee.
 */

type Policy = { planId: string; rate: { percent: number; flat: number }; allowBankTransfer: boolean; overridden: boolean };

let policy: Policy;
let policyError: Error | null = null;
const inits: Record<string, any>[] = [];
const chargesRecorded: Record<string, any>[] = [];
const orderInserts: Record<string, any>[][] = [];
const donationInserts: Record<string, any>[] = [];

const site = {
  id: "site-1", is_live: true, category: "ecommerce", user_id: "owner-1", is_demo: false,
  bank_name: "GTB", account_number: "0123456789", account_name: "Ada Stores",
  paystack_subaccount: "ACCT_test",
  site_data: { donationEnabled: true, businessName: "Ada Stores" } as Record<string, unknown>,
};

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email", () => ({ sendEmail: async () => true }));
vi.mock("@/lib/plan-fees", () => ({
  feePolicyForOwner: async () => { if (policyError) throw policyError; return policy; },
}));
vi.mock("@/lib/payment-charges", () => ({
  recordPaymentCharge: async (c: Record<string, any>) => { chargesRecorded.push(c); },
}));
let initError: Error | null = null;

vi.mock("@/lib/paystack", () => ({
  initTransaction: async (p: Record<string, any>) => {
    if (initError) throw initError;
    inits.push(p);
    return { access_code: "ac_1", reference: p.reference, authorization_url: "https://paystack.test" };
  },
}));

/** A query builder that answers any chain of filters with `result`. */
function query(result: unknown) {
  const q: any = {
    select: () => q, in: () => q, eq: () => q, order: () => q, limit: () => q,
    maybeSingle: async () => result,
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return q;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table === "sites") return query({ data: site });
      if (table === "products") {
        return query({ data: [{ id: "p1", price: 10_000, stock: 5, is_active: true, name: "Bag", is_offer: false, offer_percent: 0 }] });
      }
      if (table === "orders") {
        return { insert: async (rows: Record<string, any>[]) => { orderInserts.push(rows); return { error: null }; } };
      }
      if (table === "donations") {
        return { insert: async (row: Record<string, any>) => { donationInserts.push(row); return { error: null }; } };
      }
      return query({ data: null, error: null });
    },
  }),
}));

function post(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", origin: "http://localhost" },
  });
}

const order = (method: "paystack" | "transfer") => ({
  siteId: "site-1", method, buyer: { name: "Tolu", email: "tolu@example.com" },
  items: [{ productId: "p1", qty: 1 }],
});

beforeEach(() => {
  vi.resetModules();
  inits.length = 0;
  chargesRecorded.length = 0;
  orderInserts.length = 0;
  donationInserts.length = 0;
  policyError = null;
  initError = null;
  site.site_data = { donationEnabled: true, businessName: "Ada Stores" };
  policy = { planId: "free", rate: { percent: 3, flat: 75 }, allowBankTransfer: false, overridden: false };
});

describe("store checkout on the Free plan", () => {
  it("charges subtotal + fee and sends the fee as transaction_charge", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const res = await POST(post("/api/checkout", order("paystack")));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(inits).toHaveLength(1);
    expect(inits[0].amountNaira).toBe(10_375);
    expect(inits[0].transactionCharge).toBe(375);
    expect(inits[0].subaccount).toBe("ACCT_test");
    expect(inits[0].bearer).toBe("subaccount");
    expect(body).toMatchObject({ subtotal: 10_000, platformFee: 375, charge: 10_375 });
  });

  it("records the order at the subtotal, so the owner's revenue excludes the fee", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    await POST(post("/api/checkout", order("paystack")));
    const rows = orderInserts[0];
    expect(rows.reduce((s, r) => s + r.amount, 0)).toBe(10_000);
  });

  it("writes one charge record for the payment", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    await POST(post("/api/checkout", order("paystack")));
    expect(chargesRecorded).toHaveLength(1);
    expect(chargesRecorded[0]).toMatchObject({ kind: "order", siteId: "site-1", ownerId: "owner-1" });
    expect(chargesRecorded[0].quote).toEqual({ subtotal: 10_000, platformFee: 375, passthroughFee: 0, totalCharged: 10_375 });
  });

  it("refuses a bank transfer, before any order is written", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const res = await POST(post("/api/checkout", order("transfer")));
    expect(res.status).toBe(400);
    expect(orderInserts).toHaveLength(0);
    expect(inits).toHaveLength(0);
  });

  it("applies the fee to shipping too, since that is part of what the owner is owed", async () => {
    site.site_data = { shippingZones: [{ id: "z1", name: "Lagos", fee: 2_000 }] };
    const { POST } = await import("@/app/api/checkout/route");
    await POST(post("/api/checkout", { ...order("paystack"), shippingZoneId: "z1" }));
    // 3% of 12,000 = 360, + 75
    expect(inits[0].transactionCharge).toBe(435);
    expect(inits[0].amountNaira).toBe(12_435);
  });

  it("stops rather than guess when the plan cannot be read", async () => {
    policyError = new Error("db down");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { POST } = await import("@/app/api/checkout/route");
    const res = await POST(post("/api/checkout", order("paystack")));
    errors.mockRestore();
    expect(res.status).toBe(503);
    expect(inits).toHaveLength(0);
    expect(orderInserts).toHaveLength(0);
  });
});

describe("a store whose payout account Paystack rejects", () => {
  it("tells the shopper what they can do instead of repeating Paystack's jargon", async () => {
    policy = { planId: "growth", rate: { percent: 0, flat: 0 }, allowBankTransfer: true, overridden: false };
    initError = new Error("Invalid Subaccount.");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { POST } = await import("@/app/api/checkout/route");
    const res = await POST(post("/api/checkout", order("paystack")));
    const body = await res.json();
    expect(errors).toHaveBeenCalledWith(expect.stringMatching(/site-1/));
    errors.mockRestore();
    expect(body.error).toMatch(/bank transfer/);
    expect(body.error).not.toMatch(/Subaccount/);
  });
});

describe("store checkout on a plan without a fee", () => {
  beforeEach(() => {
    policy = { planId: "growth", rate: { percent: 0, flat: 0 }, allowBankTransfer: true, overridden: false };
  });

  it("charges exactly the order total and sends no transaction_charge, as before", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    await POST(post("/api/checkout", order("paystack")));
    expect(inits[0].amountNaira).toBe(10_000);
    expect(inits[0].transactionCharge).toBeUndefined();
    expect(inits[0].bearer).toBe("subaccount");
  });

  it("still takes bank transfers", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const res = await POST(post("/api/checkout", order("transfer")));
    expect(res.status).toBe(200);
    expect(orderInserts).toHaveLength(1);
  });
});

describe("donations", () => {
  it("charge the gift + fee, send the fee as transaction_charge, and record the gift alone", async () => {
    const { POST } = await import("@/app/api/donations/route");
    const res = await POST(post("/api/donations", { siteId: "site-1", email: "d@example.com", amount: 5_000 }));
    const body = await res.json();

    // 3% of 5,000 = 150, + 75
    expect(inits[0].amountNaira).toBe(5_225);
    expect(inits[0].transactionCharge).toBe(225);
    expect(inits[0].bearer).toBe("subaccount");
    expect(donationInserts[0].amount).toBe(5_000);
    expect(body).toMatchObject({ amount: 5_000, platformFee: 225, charge: 5_225 });
    expect(chargesRecorded[0]).toMatchObject({ kind: "donation" });
  });

  it("charge exactly the gift on a plan without a fee", async () => {
    policy = { planId: "pro", rate: { percent: 0, flat: 0 }, allowBankTransfer: true, overridden: false };
    const { POST } = await import("@/app/api/donations/route");
    await POST(post("/api/donations", { siteId: "site-1", email: "d@example.com", amount: 5_000 }));
    expect(inits[0].amountNaira).toBe(5_000);
    expect(inits[0].transactionCharge).toBeUndefined();
  });
});
