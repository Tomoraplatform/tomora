import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, nextCharge } from "@/lib/constants";
import { loadPlanDiscounts, discountedPrice } from "@/lib/discounts";

/**
 * What a user owes for a plan right now, before VAT and before any coupon.
 *
 * The rules are fiddly (Pro walks a 3-month cycle, the one-time plan drops to
 * its renewal price after the first year, and an admin can discount any plan),
 * so they live here and nowhere else. The "check this code" button and the
 * payment itself both call this, which is what stops a customer being quoted
 * one price and charged another.
 */
export async function planChargeAmount(userId: string, planId: string): Promise<number | null> {
  const plan = getPlan(planId);
  if (!plan || plan.price == null) return null;

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("billing_cycle_position, plan")
    .eq("user_id", userId)
    .maybeSingle();

  let amount = plan.price;
  // Pro uses the 3-month cycle; a renewal (already on Pro) uses nextCharge.
  if (planId === "pro" && sub?.plan === "pro") {
    amount = nextCharge(sub.billing_cycle_position ?? 0).amount;
  }
  // One-time plan: full price for the first year, then the yearly renewal.
  if (planId === "onetime" && sub?.plan === "onetime") {
    amount = plan.renewal ?? plan.price;
  }

  const discounts = await loadPlanDiscounts();
  return discountedPrice(amount, discounts[planId]);
}
