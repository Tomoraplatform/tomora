"use server";

import { revalidatePath } from "next/cache";
import { revalidateSite } from "@/lib/site-cache";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
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
  /** Hero section (synced into the current site). */
  heroHeadline?: string;
  heroSubtext?: string;
  heroImage?: string;
  /** Footer credit text (defaults to "Built with Tomora"; empty hides it). */
  footerCredit?: string;
  /** Custom browser-tab favicon (paid plans only; ignored server-side otherwise). */
  faviconUrl?: string;
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

  // A custom favicon is a paid-plan feature; verify server-side.
  const { data: sub } = await supabase
    .from("subscriptions").select("status").eq("user_id", user.id).maybeSingle();
  const isPaid = (sub as { status?: string } | null)?.status === "active";

  // Sync the brand fields into the current site's site_data so templates reflect them.
  const siteId = await currentSiteId(user.id);
  const { data: site } = siteId
    ? await supabase.from("sites").select("id, site_data").eq("id", siteId).maybeSingle()
    : { data: null };
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
      // Hero section (form is prefilled from the site, so these are safe to write).
      heroHeadline: input.heroHeadline !== undefined ? input.heroHeadline : sd.heroHeadline,
      heroSubtext: input.heroSubtext !== undefined ? input.heroSubtext : sd.heroSubtext,
      heroImage: input.heroImage !== undefined ? (input.heroImage || undefined) : sd.heroImage,
      // Footer credit is editable by everyone; empty string clears it to hide the credit.
      footerCredit: input.footerCredit !== undefined ? input.footerCredit : sd.footerCredit,
      // Favicon: only persist changes for paid plans; free plans keep whatever's there.
      faviconUrl: isPaid ? (input.faviconUrl || undefined) : sd.faviconUrl,
    };
    await supabase.from("sites").update({ site_data: updated }).eq("id", site.id);
    revalidateSite(site.id);
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
