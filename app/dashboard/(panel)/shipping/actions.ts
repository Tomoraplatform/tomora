"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
import type { SiteData } from "@/lib/database.types";

/** Saves the store's shipping locations + fees shown at checkout. */
export async function saveShipping(zones: { id: string; name: string; fee: number }[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const siteId = await currentSiteId(user.id);
    if (!siteId) return { ok: false, error: "No site found." };

    const { data: site } = await supabase.from("sites").select("id, site_data").eq("id", siteId).maybeSingle();
    if (!site) return { ok: false, error: "No site found." };

    const clean = (zones || []).slice(0, 200).map((z) => ({
      id: String(z.id || `z-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
      name: String(z.name || "").trim().slice(0, 80),
      fee: Math.max(0, Math.round(Number(z.fee) || 0)),
    })).filter((z) => z.name);

    const sd = (site.site_data || {}) as SiteData;
    const { error } = await supabase.from("sites").update({ site_data: { ...sd, shippingZones: clean } }).eq("id", site.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/shipping");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
