"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
import type { SiteData } from "@/lib/database.types";

/**
 * Updates the manually-added (offline) donation total and/or the goal for the
 * owner's site. Offline gifts add to the live "Donation so far" figure and the
 * progress bar (total = online donations + this manual amount).
 */
export async function updateDonationTotals(input: { manual?: number; goal?: number }): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const siteId = await currentSiteId(user.id);
    if (!siteId) return { ok: false, error: "No site found." };

    const { data: site } = await supabase.from("sites").select("id, site_data").eq("id", siteId).maybeSingle();
    if (!site) return { ok: false, error: "No site found." };

    const sd = (site.site_data || {}) as SiteData;
    const updated: SiteData = { ...sd };
    if (input.manual != null) updated.donationManual = Math.max(0, Math.round(input.manual));
    if (input.goal != null) updated.donationGoal = Math.max(0, Math.round(input.goal));

    const { error } = await supabase.from("sites").update({ site_data: updated }).eq("id", site.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/donations");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
