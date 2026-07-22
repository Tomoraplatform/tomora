import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CouponResult {
  ok: boolean;
  error?: string;
  couponId?: string;
  code?: string;
  discountedPrice?: number;   // naira, after discount (never below 0)
  discountLabel?: string;     // e.g. "20% off" or "₦2,000 off"
}

/**
 * Validates a coupon for a course and returns the discounted price.
 * Checks: exists, active, not expired, under its usage cap, and scoped to
 * this course (or global). Purely read-only; the used_count is bumped only
 * after a successful payment in the settlement path.
 */
export async function validateCoupon(rawCode: string, courseId: string, price: number): Promise<CouponResult> {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code." };

  const admin = createAdminClient();
  const { data: c } = await admin.from("academy_coupons").select("*").eq("code", code).maybeSingle();
  if (!c || !c.active) return { ok: false, error: "This coupon code is not valid." };
  if (c.course_id && c.course_id !== courseId) return { ok: false, error: "This coupon does not apply to this course." };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { ok: false, error: "This coupon has expired." };
  if (c.max_uses != null && c.used_count >= c.max_uses) return { ok: false, error: "This coupon has reached its usage limit." };

  const value = Math.max(0, c.discount_value || 0);
  const discount = c.discount_type === "fixed" ? value : Math.round((price * value) / 100);
  const discountedPrice = Math.max(0, price - discount);
  const discountLabel = c.discount_type === "fixed" ? `₦${value.toLocaleString()} off` : `${value}% off`;

  return { ok: true, couponId: c.id, code, discountedPrice, discountLabel };
}

/** Increments a coupon's redemption count (called once payment is confirmed). */
export async function redeemCoupon(couponId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin.from("academy_coupons").select("used_count").eq("id", couponId).maybeSingle();
  if (data) await admin.from("academy_coupons").update({ used_count: (data.used_count || 0) + 1 }).eq("id", couponId);
}
