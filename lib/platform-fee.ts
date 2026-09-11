/**
 * Tomora's per-transaction platform fee.
 *
 * Pure and client-safe on purpose: the checkout drawer and the donation form
 * show the customer the same number the server charges, because both call
 * this. The server stays the authority. It resolves the rate from the
 * merchant's plan, never from the browser.
 *
 *   platformFee = round(subtotal × percent / 100) + flat
 *
 * `subtotal` is everything the merchant is owed: items after any discount,
 * plus shipping, or the donation itself. The customer is charged
 * subtotal + platformFee, and the fee reaches Tomora's main account as
 * Paystack's `transaction_charge` on the split.
 */

export interface FeeRate {
  /** Percentage of the subtotal: 3 means 3%. */
  percent: number;
  /** Flat naira amount added once per payment. */
  flat: number;
}

export const NO_FEE: FeeRate = { percent: 0, flat: 0 };

/**
 * Limits on a rate read from the database. Someone typing 30 for "3%", or
 * 7500 for "₦75", should not be able to charge customers that. A value outside
 * these bounds is refused and the plan's default is used instead.
 */
export const MAX_FEE_PERCENT = 20;
export const MAX_FEE_FLAT = 5000;

/** A usable rate, or null when the input is missing, not a number, or out of range. */
export function validRate(percent: unknown, flat: unknown): FeeRate | null {
  const p = Number(percent);
  const f = Number(flat);
  if (percent === null || percent === undefined || flat === null || flat === undefined) return null;
  if (!Number.isFinite(p) || !Number.isFinite(f)) return null;
  if (p < 0 || p > MAX_FEE_PERCENT || f < 0 || f > MAX_FEE_FLAT) return null;
  // Flat fees are whole naira: Paystack takes kobo, but a fraction of a naira
  // on a price list is a typo, not a policy.
  return { percent: p, flat: Math.round(f) };
}

export function isFree(rate: FeeRate | null | undefined): boolean {
  return !rate || (rate.percent <= 0 && rate.flat <= 0);
}

/** The fee on one payment, in whole naira. Zero for a zero or negative subtotal. */
export function computePlatformFee(subtotal: number, rate: FeeRate | null | undefined): number {
  if (!rate || isFree(rate) || !(subtotal > 0)) return 0;
  return Math.round((subtotal * rate.percent) / 100) + Math.round(rate.flat);
}

export interface ChargeQuote {
  /** What the merchant is owed. */
  subtotal: number;
  /** Tomora's cut, sent to Paystack as transaction_charge. */
  platformFee: number;
  /** Paystack's fee passed on to the customer, when the merchant chose that. */
  passthroughFee: number;
  /** What the customer pays. */
  totalCharged: number;
}

/**
 * Everything the customer is charged for one payment.
 *
 * `passthroughPercent` is the existing "customer pays the Paystack fee"
 * option. It grosses up the whole charge, fee included, because Paystack
 * takes its cut from the whole charge.
 */
export function quoteCharge(subtotal: number, rate: FeeRate | null | undefined, passthroughPercent = 0): ChargeQuote {
  const platformFee = computePlatformFee(subtotal, rate);
  const base = subtotal + platformFee;
  const totalCharged = passthroughPercent > 0 ? Math.round(base * (1 + passthroughPercent / 100)) : base;
  return { subtotal, platformFee, passthroughFee: totalCharged - base, totalCharged };
}

/** "3% + ₦75", "1.5%", "₦100", or "No" for a plan with no fee. */
export function feeRateLabel(rate: FeeRate | null | undefined): string {
  if (!rate || isFree(rate)) return "No";
  const parts: string[] = [];
  if (rate.percent > 0) parts.push(`${Number(rate.percent.toFixed(2))}%`);
  if (rate.flat > 0) parts.push(`₦${rate.flat.toLocaleString("en-NG")}`);
  return parts.join(" + ");
}

/** The line a pricing card shows for a plan's fee. */
export function transactionFeeLine(rate: FeeRate | null | undefined): string {
  return isFree(rate) ? "No transaction fee" : `${feeRateLabel(rate)} per transaction, paid by your customer`;
}
