"use server";

import { revalidatePath } from "next/cache";
import { revalidateSite } from "@/lib/site-cache";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
import type { SiteData } from "@/lib/database.types";
import type { Coupon } from "@/lib/coupons";

/** Saves the store's discount codes / coupons. */
export async function saveCoupons(coupons: Coupon[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const siteId = await currentSiteId(user.id);
    if (!siteId) return { ok: false, error: "No site found." };

    const { data: site } = await supabase.from("sites").select("id, site_data").eq("id", siteId).maybeSingle();
    if (!site) return { ok: false, error: "No site found." };

    // Sanitise.
    const clean: Coupon[] = (coupons || []).slice(0, 100).map((c): Coupon => ({
      id: String(c.id || `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
      code: String(c.code || "").trim().toUpperCase().slice(0, 40),
      type: c.type === "fixed" ? "fixed" : "percent",
      value: Math.max(0, Math.round(Number(c.value) || 0)),
      minOrder: c.minOrder ? Math.max(0, Math.round(Number(c.minOrder))) : undefined,
      expiresAt: c.expiresAt ? String(c.expiresAt) : undefined,
      active: !!c.active,
    })).filter((c) => c.code && c.value > 0);

    const sd = (site.site_data || {}) as SiteData;
    const { error } = await supabase.from("sites").update({ site_data: { ...sd, coupons: clean } }).eq("id", site.id);
    if (error) return { ok: false, error: error.message };
    revalidateSite(site.id);
    revalidatePath("/dashboard/discounts");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
