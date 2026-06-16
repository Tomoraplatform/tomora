"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SocialLinks, SiteData } from "@/lib/database.types";

export interface BrandInput {
  businessName: string;
  tagline: string;
  brandColor: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  social: SocialLinks;
}

export async function updateBrand(input: BrandInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  if (!input.businessName.trim()) return { ok: false, error: "Business name is required." };

  await supabase.from("profiles").update({
    business_name: input.businessName.trim(),
    tagline: input.tagline || null,
    brand_color: input.brandColor,
    logo_url: input.logoUrl || null,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
    social_links: input.social || {},
  }).eq("user_id", user.id);

  // Sync the brand fields into the site's site_data so templates reflect them.
  const { data: site } = await supabase
    .from("sites").select("id, site_data").eq("user_id", user.id).maybeSingle();
  if (site) {
    const sd = (site.site_data || {}) as SiteData;
    const updated: SiteData = {
      ...sd,
      businessName: input.businessName.trim(),
      tagline: input.tagline,
      brandColor: input.brandColor,
      logoUrl: input.logoUrl || undefined,
      phone: input.phone,
      email: input.email,
      address: input.address,
      social: input.social,
    };
    await supabase.from("sites").update({ site_data: updated }).eq("id", site.id);
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
