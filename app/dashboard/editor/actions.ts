"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/constants";
import type { SiteData } from "@/lib/database.types";

export async function saveSite(
  siteId: string,
  siteData: SiteData,
  isLive: boolean
): Promise<{ ok: boolean; error?: string; gated?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Keep the profile's brand fields in sync with the site.
  await supabase
    .from("profiles")
    .update({ brand_color: siteData.brandColor, logo_url: siteData.logoUrl || null })
    .eq("user_id", user.id);

  // Publish gating: the first (primary) site can go live on the trial; any
  // additional site can only be published on a paid Growth+ plan.
  let effectiveLive = isLive;
  let gated = false;
  if (isLive) {
    const [{ data: sites }, { data: sub }] = await Promise.all([
      supabase.from("sites").select("id").eq("user_id", user.id).order("created_at", { ascending: true }),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    const isPrimary = sites?.[0]?.id === siteId;
    if (!isPrimary) {
      const planId = sub?.status === "active" ? sub?.plan || "" : "";
      const canPublishExtra = ["growth", "pro", "custom"].includes(planId);
      if (!canPublishExtra) {
        effectiveLive = false;
        gated = true;
      }
    }
  }

  const { error } = await supabase
    .from("sites")
    .update({ site_data: siteData, is_live: effectiveLive })
    .eq("id", siteId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  if (gated) {
    return { ok: true, gated: true, error: "Saved. Publishing extra sites needs the Growth plan or higher — upgrade to take this one live." };
  }
  return { ok: true };
}
