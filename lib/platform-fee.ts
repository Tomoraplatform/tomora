/**
 * Tomora's per-transaction platform fee.
 *
 * Pure and client-safe on purpose: the checkout drawer and the donation form
 * show the customer the same number the server charges, because both call
 * this. The server stays the authority. It resolves the rate from the
 * merchant's plan, never from the browser.
 *
 * A rate is either a fixed fee chosen by the size of the payment (`tiers`),
 * or a percentage plus a flat amount:
 *
 *   platformFee = the fee of the first band the subtotal falls under
 *   platformFee = round(subtotal × percent / 100) + flat   (no tiers)
 *
 * `subtotal` is everything the merchant is owed: items after any discount,
 * plus shipping, or the donation itself. The customer is charged
 * subtotal + platformFee, and the fee reaches Tomora's main account as
 * Paystack's `transaction_charge` on the split.
 */

/** One fee band: payments under `below` naira pay `fee`. `below: null` is everything above. */
export interface FeeTier {
  below: number | null;
  fee: number;
}

export interface FeeRate {
  /** Percentage of the subtotal: 3 means 3%. Ignored when `tiers` is set. */
  percent: number;
  /** Flat naira amount added once per payment. Ignored when `tiers` is set. */
  flat: number;
  /** A fixed fee by payment size. Takes the place of percent and flat. */
  tiers?: FeeTier[];
}

export const NO_FEE: FeeRate = { percent: 0, flat: 0 };

/**
 * The Free plan's fee, set 2026-09-16: a fixed amount by order size, so a
 * customer can see exactly what they will pay rather than a percentage.
 * "Below" is strict: a ₦5,000 order is in the ₦200 band, and ₦50,000 and up
 * pays ₦750.
 */
export const FREE_PLAN_FEE_TIERS: FeeTier[] = [
  { below: 5_000, fee: 105 },
  { below: 15_000, fee: 200 },
  { below: 30_000, fee: 250 },
  { below: 50_000, fee: 500 },
  { below: null, fee: 750 },
];

/**
 * Fee bands read from the database, or null if they are not a sensible
 * schedule: every fee a whole naira amount within bounds, thresholds rising,
 * and exactly one open-ended band at the end so every payment has a fee.
 */
export function validTiers(raw: unknown): FeeTier[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) return null;
  const tiers: FeeTier[] = [];
  let last = 0;
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i] as { below?: unknown; fee?: unknown };
    const fee = Number(t?.fee);
    if (!Number.isFinite(fee) || fee < 0 || fee > MAX_FEE_FLAT) return null;
    const isLast = i === raw.length - 1;
    if (isLast) {
      if (t?.below !== null && t?.below !== undefined) return null;
      tiers.push({ below: null, fee: Math.round(fee) });
    } else {
      const below = Number(t?.below);
      if (!Number.isFinite(below) || below <= last) return null;
      last = below;
      tiers.push({ below: Math.round(below), fee: Math.round(fee) });
    }
  }
  return tiers;
}

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
  if (!rate) return true;
  if (rate.tiers?.length) return rate.tiers.every((t) => t.fee <= 0);
  return rate.percent <= 0 && rate.flat <= 0;
}

/** The fee on one payment, in whole naira. Zero for a zero or negative subtotal. */
export function computePlatformFee(subtotal: number, rate: FeeRate | null | undefined): number {
  if (!rate || isFree(rate) || !(subtotal > 0)) return 0;
  if (rate.tiers?.length) {
    const band = rate.tiers.find((t) => t.below === null || subtotal < t.below);
    return band ? Math.round(band.fee) : 0;
  }
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

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

/** "₦105–₦750", "3% + ₦75", "1.5%", "₦100", or "No" for a plan with no fee. */
export function feeRateLabel(rate: FeeRate | null | undefined): string {
  if (!rate || isFree(rate)) return "No";
  if (rate.tiers?.length) {
    const fees = rate.tiers.map((t) => t.fee);
    const lo = Math.min(...fees);
    const hi = Math.max(...fees);
    return lo === hi ? naira(lo) : `${naira(lo)}–${naira(hi)}`;
  }
  const parts: string[] = [];
  if (rate.percent > 0) parts.push(`${Number(rate.percent.toFixed(2))}%`);
  if (rate.flat > 0) parts.push(`₦${rate.flat.toLocaleString("en-NG")}`);
  return parts.join(" + ");
}

/** The line a pricing card shows for a plan's fee. */
export function transactionFeeLine(rate: FeeRate | null | undefined): string {
  if (isFree(rate)) return "No transaction fee";
  return rate?.tiers?.length
    ? `${feeRateLabel(rate)} per order by order size, paid by your customer`
    : `${feeRateLabel(rate)} per transaction, paid by your customer`;
}

/**
 * The bands in words, for a price list: "Under ₦5,000: ₦105", …,
 * "₦50,000 and above: ₦750".
 */
export function feeTierLines(tiers: FeeTier[] | null | undefined): string[] {
  if (!tiers?.length) return [];
  let from = 0;
  return tiers.map((t) => {
    const line = t.below === null
      ? `${naira(from)} and above: ${naira(t.fee)}`
      : from === 0
        ? `Under ${naira(t.below)}: ${naira(t.fee)}`
        : `${naira(from)} to under ${naira(t.below)}: ${naira(t.fee)}`;
    if (t.below !== null) from = t.below;
    return line;
  });
}
