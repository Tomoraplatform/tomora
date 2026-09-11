import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * The request that actually reaches Paystack, and how its reply is read back.
 * Amounts go over the wire in kobo.
 */

vi.mock("server-only", () => ({}));

const calls: { url: string; body: any }[] = [];
let reply: unknown = { status: true, data: { access_code: "ac", reference: "r", authorization_url: "u" } };

beforeEach(() => {
  calls.length = 0;
  vi.stubGlobal("fetch", async (url: string, init?: { body?: string }) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined });
    return { json: async () => reply } as Response;
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("initTransaction", () => {
  it("sends the fee as transaction_charge in kobo, beside the subaccount and bearer", async () => {
    const { initTransaction } = await import("../paystack");
    await initTransaction({
      email: "a@b.co", amountNaira: 10_375, reference: "tom_1", callbackUrl: "http://x",
      subaccount: "ACCT_1", bearer: "subaccount", transactionCharge: 375,
    });
    expect(calls[0].body).toMatchObject({
      amount: 1_037_500, subaccount: "ACCT_1", bearer: "subaccount", transaction_charge: 37_500,
    });
    // No percentage is sent: the subaccount's own 0% stands, and the flat
    // charge overrides it for this payment only.
    expect(calls[0].body.percentage_charge).toBeUndefined();
  });

  it("sends no transaction_charge when there is no fee", async () => {
    const { initTransaction } = await import("../paystack");
    await initTransaction({
      email: "a@b.co", amountNaira: 10_000, reference: "tom_2", callbackUrl: "http://x",
      subaccount: "ACCT_1", bearer: "subaccount",
    });
    expect("transaction_charge" in calls[0].body).toBe(false);
  });
});

describe("verifyTransaction", () => {
  it("reads Paystack's split back in naira", async () => {
    reply = {
      status: true,
      data: {
        status: "success", amount: 1_037_500, fees: 25_563,
        fees_split: { paystack: 25_563, integration: 37_500, subaccount: 974_437 },
      },
    };
    const { verifyTransaction } = await import("../paystack");
    const v = await verifyTransaction("tom_1");
    expect(v.success).toBe(true);
    expect(v.split).toEqual({ integration: 375, subaccount: 9_744.37, paystack: 255.63 });
  });

  it("has no split for a payment that did not split", async () => {
    reply = { status: true, data: { status: "success", amount: 500_000 } };
    const { verifyTransaction } = await import("../paystack");
    expect((await verifyTransaction("tomplat_1")).split).toBeUndefined();
  });
});
