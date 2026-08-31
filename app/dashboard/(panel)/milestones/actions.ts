"use server";

import { revalidatePath } from "next/cache";
import { revalidateSite } from "@/lib/site-cache";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
import type { SiteData } from "@/lib/database.types";

/** Saves the owner's manual targets (orders / revenue / visits). */
export async function saveGoals(input: { orders?: number; revenue?: number; visits?: number }): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const siteId = await currentSiteId(user.id);
    if (!siteId) return { ok: false, error: "No site found." };

    const { data: site } = await supabase.from("sites").select("id, site_data").eq("id", siteId).maybeSingle();
    if (!site) return { ok: false, error: "No site found." };

    const sd = (site.site_data || {}) as SiteData;
    const clean = (n?: number) => (n && n > 0 ? Math.round(n) : undefined);
    const updated: SiteData = {
      ...sd,
      goals: { orders: clean(input.orders), revenue: clean(input.revenue), visits: clean(input.visits) },
    };
    const { error } = await supabase.from("sites").update({ site_data: updated }).eq("id", site.id);
    if (error) return { ok: false, error: error.message };
    revalidateSite(site.id);
    revalidatePath("/dashboard/milestones");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
