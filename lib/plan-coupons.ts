import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/constants";

/**
 * Coupon codes for Tomora's own subscriptions.
 *
 * Distinct from two neighbours it is easy to confuse:
 *  - `lib/discounts.ts` cuts a plan's price for everybody, publicly.
 *  - `lib/coupons.ts` is a seller's codes for their own shoppers.
 * This one is Tomora's codes for Tomora's plans.
 *
 * Validation lives here rather than in the checkout route because both the
 * "check this code" button and the payment itself must agree, and only the
 * second one is authoritative: a browser can send any code and any price, so
 * the amount charged is always recomputed here.
 */

export interface PlanCoupon {
  id: string;
  code: string;
  percent: number;
  plan_id: string | null;
  max_uses: number | null;
  used_count: number;
  per_user_limit: number | null;
  active: boolean;
  expires_at: string | null;
  note: string | null;
  created_at: string;
}

export interface CouponCheck {
  ok: boolean;
  error?: string;
  couponId?: string;
  code?: string;
  percent?: number;
  /** Naira taken off the plan price, before VAT. */
  discount?: number;
  /** Plan price after the coupon, before VAT. */
  finalAmount?: number;
}

/** Codes are case-insensitive to type and stored uppercase. */
export function normaliseCode(raw: string): string {
  return (raw || "").trim().toUpperCase();
}

/** Applies a percent to a price, floored at 0 and rounded to whole naira. */
export function applyPercent(amount: number, percent: number): number {
  const pct = Math.min(100, Math.max(0, percent));
  const discount = Math.round((amount * pct) / 100);
  return Math.max(0, Math.min(discount, amount));
}

/**
 * Checks a code for one user on one plan at one price.
 *
 * `amount` is the plan price after any public plan discount and before VAT, so
 * a coupon stacks on top of a sale rather than replacing it.
 */
export async function validatePlanCoupon(
  rawCode: string,
  planId: string,
  amount: number,
  userId: string
): Promise<CouponCheck> {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, error: "Enter a coupon code." };

  const admin = createAdminClient();
  const { data } = await admin.from("plan_coupons").select("*").eq("code", code).maybeSingle();
  const c = data as PlanCoupon | null;

  if (!c || !c.active) return { ok: false, error: "That code isn't valid." };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "This code has expired." };
  }
  if (c.max_uses != null && c.used_count >= c.max_uses) {
    return { ok: false, error: "This code has been fully claimed." };
  }
  if (c.plan_id && c.plan_id !== planId) {
    const only = getPlan(c.plan_id)?.name || c.plan_id;
    return { ok: false, error: `This code only works on the ${only} plan.` };
  }
  if (c.percent <= 0) return { ok: false, error: "That code isn't valid." };

  // Per-user cap counts settled redemptions, so an abandoned checkout never
  // burns someone's one use of a code.
  if (c.per_user_limit != null) {
    const { count } = await admin
      .from("plan_coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", c.id)
      .eq("user_id", userId);
    if ((count || 0) >= c.per_user_limit) {
      return { ok: false, error: "You have already used this code." };
    }
  }

  const discount = applyPercent(amount, c.percent);
  return {
    ok: true,
    couponId: c.id,
    code: c.code,
    percent: c.percent,
    discount,
    finalAmount: amount - discount,
  };
}

/**
 * Records a redemption once the payment is confirmed.
 *
 * Keyed on the payment reference, so the callback and the webhook both landing
 * on the same payment still counts as one use. Never throws: a coupon's
 * bookkeeping must not be able to fail an activated subscription.
 */
export async function redeemPlanCoupon(input: {
  couponId: string;
  userId: string;
  reference: string;
  planId?: string;
  percent: number;
  discountAmount: number;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("plan_coupon_redemptions").insert({
      coupon_id: input.couponId,
      user_id: input.userId,
      reference: input.reference,
      plan_id: input.planId || null,
      percent: input.percent,
      discount_amount: input.discountAmount,
    });
    // A duplicate reference means this payment was already counted.
    if (error) return;
    await admin.rpc("bump_plan_coupon_use", { p_coupon: input.couponId });
  } catch {
    /* bookkeeping only */
  }
}
