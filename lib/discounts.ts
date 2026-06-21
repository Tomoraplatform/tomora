import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type DiscountMap = Record<string, number>; // planId -> percent (active only)

/** Loads active per-plan discounts. Best-effort (table may not exist pre-0009). */
export async function loadPlanDiscounts(): Promise<DiscountMap> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("plan_discounts").select("plan_id, percent, active");
    const map: DiscountMap = {};
    (data as { plan_id: string; percent: number; active: boolean }[] | null)?.forEach((d) => {
      if (d.active && d.percent > 0) map[d.plan_id] = d.percent;
    });
    return map;
  } catch {
    return {};
  }
}

/** Applies a percent discount to a price, rounded to the nearest ₦100. */
export function discountedPrice(price: number, percent?: number): number {
  if (!percent || percent <= 0) return price;
  return Math.round((price * (1 - percent / 100)) / 100) * 100;
}
