"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
import type { SiteData } from "@/lib/database.types";

/**
 * The wallet is a record, not an account.
 *
 * Customers pay through Paystack straight into the bank account the owner
 * connected, so Tomora never holds their money and has nothing to pay out.
 * Withdrawal used to live here and has been removed rather than left as a
 * button that would move money Tomora does not have.
 */

/** Restarts the "received so far" total from today. History is untouched. */
export async function resetWalletTotal(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const siteId = await currentSiteId(user.id);
    if (!siteId) return { ok: false, error: "No site found." };

    const { data: site } = await supabase
      .from("sites").select("id, site_data").eq("id", siteId).maybeSingle();
    if (!site) return { ok: false, error: "No site found." };

    const sd = (site.site_data || {}) as SiteData;
    const { error } = await supabase
      .from("sites")
      .update({ site_data: { ...sd, walletResetAt: new Date().toISOString() } })
      .eq("id", site.id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/wallet");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
