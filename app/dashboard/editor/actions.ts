"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SiteData } from "@/lib/database.types";

export async function saveSite(
  siteId: string,
  siteData: SiteData,
  isLive: boolean
): Promise<{ ok: boolean; error?: string }> {
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

  const { error } = await supabase
    .from("sites")
    .update({ site_data: siteData, is_live: isLive })
    .eq("id", siteId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
