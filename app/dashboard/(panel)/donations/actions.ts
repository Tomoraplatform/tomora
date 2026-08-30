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
export async function updateDonationTotals(input: { manual?: number; manualCount?: number; goal?: number }): Promise<{ ok: boolean; error?: string }> {
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
    if (input.manualCount != null) updated.donationManualCount = Math.max(0, Math.round(input.manualCount));
    if (input.goal != null) updated.donationGoal = Math.max(0, Math.round(input.goal));

    const { error } = await supabase.from("sites").update({ site_data: updated }).eq("id", site.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/donations");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * Records one gift received off the platform: cash, a bank transfer, an
 * envelope on a Sunday.
 *
 * Adds the money and one to the gift count in a single step, because they are
 * one event. Keeping them as two fields the owner had to remember to update
 * together is what left progress bars climbing while the "N gifts" line under
 * them stood still.
 */
export async function recordOfflineGift(
  input: { amount: number; projectId?: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const amount = Math.max(0, Math.round(input.amount || 0));
    if (amount <= 0) return { ok: false, error: "Enter how much the gift was." };

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const siteId = await currentSiteId(user.id);
    if (!siteId) return { ok: false, error: "No site found." };

    const { data: site } = await supabase.from("sites").select("id, site_data").eq("id", siteId).maybeSingle();
    if (!site) return { ok: false, error: "No site found." };

    const sd = (site.site_data || {}) as SiteData;
    const updated: SiteData = { ...sd };

    if (input.projectId) {
      const projects = [...(sd.donationProjects || [])];
      const i = projects.findIndex((p) => p.id === input.projectId);
      if (i === -1) return { ok: false, error: "That project no longer exists." };
      projects[i] = {
        ...projects[i],
        manualRaised: Math.max(0, Math.round(projects[i].manualRaised || 0)) + amount,
        manualCount: Math.max(0, Math.round(projects[i].manualCount || 0)) + 1,
      };
      updated.donationProjects = projects;
    } else {
      updated.donationManual = Math.max(0, Math.round(sd.donationManual || 0)) + amount;
      updated.donationManualCount = Math.max(0, Math.round(sd.donationManualCount || 0)) + 1;
    }

    const { error } = await supabase.from("sites").update({ site_data: updated }).eq("id", site.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/donations");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
