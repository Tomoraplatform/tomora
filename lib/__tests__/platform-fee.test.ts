import { describe, expect, it } from "vitest";
import {
  computePlatformFee, quoteCharge, validRate, feeRateLabel, transactionFeeLine, NO_FEE,
} from "../platform-fee";
import { PLANS, getPlan } from "../constants";

/**
 * The sum a customer is charged. The checkout drawer, the donation form and
 * both payment endpoints all call these, so a mistake here is a mistake on
 * every payment.
 */

const FREE = { percent: 3, flat: 75 };
const STARTER = { percent: 1.5, flat: 0 };

describe("computePlatformFee", () => {
  it("is round(subtotal × percent) + flat", () => {
    expect(computePlatformFee(10_000, FREE)).toBe(375); // 300 + 75
    expect(computePlatformFee(10_000, STARTER)).toBe(150);
  });

  it("rounds the percentage part to whole naira before adding the flat part", () => {
    // 3% of 1,234 is 37.02
    expect(computePlatformFee(1_234, FREE)).toBe(37 + 75);
    // 1.5% of 999 is 14.985, which rounds up
    expect(computePlatformFee(999, STARTER)).toBe(15);
  });

  it("is nothing on a plan without a fee, or on nothing", () => {
    expect(computePlatformFee(50_000, NO_FEE)).toBe(0);
    expect(computePlatformFee(50_000, null)).toBe(0);
    expect(computePlatformFee(0, FREE)).toBe(0);
    expect(computePlatformFee(-10, FREE)).toBe(0);
  });
});

describe("quoteCharge", () => {
  it("charges the customer subtotal + fee, and the merchant is owed the subtotal", () => {
    const q = quoteCharge(10_000, FREE);
    expect(q).toEqual({ subtotal: 10_000, platformFee: 375, passthroughFee: 0, totalCharged: 10_375 });
  });

  it("charges exactly the subtotal on a fee-free plan, as before", () => {
    expect(quoteCharge(25_000, NO_FEE).totalCharged).toBe(25_000);
  });

  it("keeps the old pass-through sum when the owner passes Paystack's fee on and there is no platform fee", () => {
    // What the checkout charged before the fee existed.
    expect(quoteCharge(10_000, NO_FEE, 2.5).totalCharged).toBe(Math.round(10_000 * 1.025));
  });

  it("grosses up the whole charge, fee included, when Paystack's fee is passed on", () => {
    const q = quoteCharge(10_000, FREE, 2.5);
    expect(q.platformFee).toBe(375);
    expect(q.totalCharged).toBe(Math.round(10_375 * 1.025));
    expect(q.subtotal + q.platformFee + q.passthroughFee).toBe(q.totalCharged);
  });
});

describe("validRate", () => {
  it("accepts sensible rates, including numbers that arrive as strings from Postgres", () => {
    expect(validRate(3, 75)).toEqual({ percent: 3, flat: 75 });
    expect(validRate("1.50", "0")).toEqual({ percent: 1.5, flat: 0 });
  });

  it("refuses a rate nobody meant", () => {
    expect(validRate(30, 75)).toBeNull(); // 30 typed for 3
    expect(validRate(3, 7500)).toBeNull(); // 7,500 typed for 75
    expect(validRate(-1, 0)).toBeNull();
    expect(validRate("abc", 0)).toBeNull();
    expect(validRate(null, null)).toBeNull();
    expect(validRate(undefined, 0)).toBeNull();
  });
});

describe("labels", () => {
  it("say the fee the way a pricing card should", () => {
    expect(feeRateLabel(FREE)).toBe("3% + ₦75");
    expect(feeRateLabel(STARTER)).toBe("1.5%");
    expect(transactionFeeLine(NO_FEE)).toBe("No transaction fee");
    expect(transactionFeeLine(FREE)).toBe("3% + ₦75 per transaction, paid by your customer");
  });
});

describe("the plan config", () => {
  it("has the launch prices and fees", () => {
    const byId = Object.fromEntries(PLANS.map((p) => [p.id, p]));
    expect([byId.free.price, byId.free.transactionFeePercent, byId.free.transactionFeeFlat]).toEqual([0, 3, 75]);
    expect([byId.starter.price, byId.starter.transactionFeePercent, byId.starter.transactionFeeFlat]).toEqual([4900, 1.5, 0]);
    expect([byId.growth.price, byId.growth.transactionFeePercent]).toEqual([9800, 0]);
    expect([byId.pro.price, byId.pro.period, byId.pro.transactionFeePercent]).toEqual([19800, "month", 0]);
    expect([byId.onetime.price, byId.onetime.transactionFeePercent]).toEqual([84500, 0]);
    expect([byId.custom.price, byId.custom.transactionFeePercent]).toEqual([null, 0]);
  });

  it("gives the site limits from the brief", () => {
    const limits = Object.fromEntries(PLANS.map((p) => [p.id, p.siteLimit]));
    expect(limits).toMatchObject({ free: 1, starter: 3, growth: 5, pro: 10 });
  });

  it("takes online payment only on the plan that charges a fee on every payment", () => {
    expect(getPlan("free")!.allowBankTransfer).toBe(false);
    for (const id of ["starter", "growth", "pro", "onetime", "custom", "basic"]) {
      expect(getPlan(id)!.allowBankTransfer).toBe(true);
    }
  });

  it("still resolves the old trial id, as the Free plan", () => {
    expect(getPlan("trial")!.id).toBe("free");
  });
});
