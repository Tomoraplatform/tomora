import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));

import { splitSale, CREATOR_PLATFORM_FEE_PERCENT } from "../creator/money";
import { VAT_PERCENT, PAYSTACK_FEE_PERCENT } from "../constants";

/**
 * What a creator is paid, and what their student pays for it.
 *
 * The fee is added on top rather than taken out: a creator who lists a course
 * at ₦10,000 receives ₦10,000. Everything above that price is the student's to
 * cover. The arithmetic below is what Paystack is asked to split, so an error
 * here is money going to the wrong account.
 */
describe("splitSale", () => {
  it("charges the fee on top, so the creator keeps the whole price", () => {
    const s = splitSale(10000);
    expect(s.creatorShare).toBe(10000);
    expect(s.platformFee).toBe(300);      // 3% of the price
    expect(s.gross).toBeGreaterThan(10000);
  });

  it("takes three percent, not five", () => {
    expect(CREATOR_PLATFORM_FEE_PERCENT).toBe(3);
    expect(splitSale(50000).platformFee).toBe(1500);
  });

  it("adds up: what the student pays covers every part exactly", () => {
    for (const price of [1000, 2500, 9999, 10000, 47500, 250000]) {
      const s = splitSale(price);
      expect(s.gross).toBe(s.price + s.platformFee + s.vat + s.processingFee);
    }
  });

  it("leaves the creator whole after Paystack takes its cut", () => {
    // At checkout the subaccount is charged Tomora's fee plus the VAT, and
    // bears Paystack's processing fee. What remains must be the price.
    for (const price of [1000, 10000, 47500, 250000]) {
      const s = splitSale(price);
      const transactionCharge = s.platformFee + s.vat;
      const toCreator = s.gross - transactionCharge - s.processingFee;
      expect(toCreator).toBe(price);
    }
  });

  it("charges VAT on the price the creator set", () => {
    const s = splitSale(10000);
    expect(s.vat).toBe(Math.round((10000 * VAT_PERCENT) / 100));
  });

  it("grosses the processing fee up, so Paystack's cut does not eat the price", () => {
    const s = splitSale(10000);
    const rate = PAYSTACK_FEE_PERCENT / 100;
    // Paystack charges its percentage on everything it collects.
    expect(Math.round(s.gross * rate)).toBeCloseTo(s.processingFee, -1);
  });

  it("handles a free course without inventing a fee", () => {
    const s = splitSale(0);
    expect(s).toMatchObject({ price: 0, platformFee: 0, vat: 0, creatorShare: 0, gross: 0 });
  });

  it("never returns a negative from a nonsense price", () => {
    const s = splitSale(-5000);
    expect(s.price).toBe(0);
    expect(s.gross).toBe(0);
    expect(s.creatorShare).toBe(0);
  });
});
