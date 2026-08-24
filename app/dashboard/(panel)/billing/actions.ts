"use server";

import { createClient } from "@/lib/supabase/server";
import { planChargeAmount } from "@/lib/plan-pricing";
import { validatePlanCoupon } from "@/lib/plan-coupons";
import { withVat } from "@/lib/constants";

export interface CouponQuote {
  ok: boolean;
  error?: string;
  code?: string;
  percent?: number;
  /** Plan price before the coupon, before VAT. */
  wasAmount?: number;
  /** Plan price after the coupon, before VAT. */
  nowAmount?: number;
  /** What will actually be charged, VAT included. */
  totalWithVat?: number;
}

/**
 * The price of a plan for this user right now, with no coupon.
 *
 * Asked for when the checkout box opens so the figures shown are the server's,
 * including the Pro cycle position and any public discount.
 */
export async function quotePlan(planId: string): Promise<CouponQuote> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const amount = await planChargeAmount(user.id, planId);
  if (amount == null) return { ok: false, error: "Invalid plan." };

  return { ok: true, wasAmount: amount, nowAmount: amount, totalWithVat: withVat(amount) };
}

/**
 * Checks a coupon code and quotes the new price, without charging anything.
 *
 * Only a preview: the checkout route validates the code again before taking
 * any money, so a stale or tampered quote cannot become a real discount.
 */
export async function checkPlanCoupon(planId: string, code: string): Promise<CouponQuote> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const amount = await planChargeAmount(user.id, planId);
  if (amount == null) return { ok: false, error: "Invalid plan." };

  const res = await validatePlanCoupon(code, planId, amount, user.id);
  if (!res.ok) return { ok: false, error: res.error };

  return {
    ok: true,
    code: res.code,
    percent: res.percent,
    wasAmount: amount,
    nowAmount: res.finalAmount,
    totalWithVat: withVat(res.finalAmount || 0),
  };
}
