"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDefaultSiteData } from "@/lib/site-data";
import { createCatalogContent, isCatalogTemplate, catalogTemplate, type CatalogCategoryId } from "@/lib/catalog";
import { slugifySubdomain } from "@/lib/utils";
import { TRIAL_DAYS } from "@/lib/constants";
import type { SiteCategory, SocialLinks } from "@/lib/database.types";

export interface OnboardingPayload {
  /** Catalog category id (shop/portfolio/education/organization/events). */
  category: string;
  templateId: string;
  businessName: string;
  tagline?: string;
  brandColor: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  social: SocialLinks;
}

/** Maps a catalog category to the existing site_category DB enum. */
function toDbCategory(cat: string): SiteCategory {
  const map: Record<CatalogCategoryId, SiteCategory> = {
    shop: "ecommerce",
    portfolio: "creator",
    education: "business",
    organization: "organization",
    events: "organization",
  };
  return map[cat as CatalogCategoryId] ?? "business";
}

export interface OnboardingResult {
  ok: boolean;
  error?: string;
  subdomain?: string;
  siteId?: string;
}

export async function completeOnboarding(
  payload: OnboardingPayload
): Promise<OnboardingResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be logged in." };

  if (!payload.businessName?.trim()) {
    return { ok: false, error: "Business name is required." };
  }

  // 1. Upsert the profile.
  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      business_name: payload.businessName.trim(),
      tagline: payload.tagline || null,
      logo_url: payload.logoUrl || null,
      brand_color: payload.brandColor,
      phone: payload.phone || null,
      email: payload.email || user.email,
      address: payload.address || null,
      social_links: payload.social || {},
    },
    { onConflict: "user_id" }
  );

  // 2. Reuse an existing site if the user already has one.
  const { data: existing } = await supabase
    .from("sites")
    .select("id, subdomain")
    .eq("user_id", user.id)
    .maybeSingle();

  const isCatalog = isCatalogTemplate(payload.templateId);
  const dbCategory: SiteCategory = isCatalog
    ? toDbCategory(catalogTemplate(payload.templateId)!.category)
    : toDbCategory(payload.category);

  const siteData = isCatalog
    ? createCatalogContent(payload.templateId, {
        businessName: payload.businessName.trim(),
        brandColor: payload.brandColor,
        logoUrl: payload.logoUrl,
        tagline: payload.tagline,
      })
    : createDefaultSiteData(payload.templateId, dbCategory, {
        businessName: payload.businessName.trim(),
        brandColor: payload.brandColor,
        logoUrl: payload.logoUrl,
        tagline: payload.tagline,
      });
  // mirror contact details into site_data for templates
  siteData.phone = payload.phone;
  siteData.email = payload.email || user.email || undefined;
  siteData.address = payload.address;
  siteData.social = payload.social;

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + TRIAL_DAYS);

  if (existing) {
    const { error } = await supabase
      .from("sites")
      .update({
        template_id: payload.templateId,
        category: dbCategory,
        site_data: siteData,
        is_live: true,
        trial_ends_at: trialEnds.toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true, subdomain: existing.subdomain, siteId: existing.id };
  }

  // 3. Generate a unique subdomain.
  const base = slugifySubdomain(payload.businessName) || "site";
  let subdomain = base;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase
      .from("sites")
      .insert({
        user_id: user.id,
        template_id: payload.templateId,
        category: dbCategory,
        subdomain,
        domain_status: "none",
        is_live: true,
        trial_ends_at: trialEnds.toISOString(),
        site_data: siteData,
      })
      .select("id, subdomain")
      .single();

    if (!error && data) {
      revalidatePath("/dashboard");
      return { ok: true, subdomain: data.subdomain, siteId: data.id };
    }
    if (error && error.code === "23505") {
      subdomain = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
      continue;
    }
    return { ok: false, error: error?.message || "Could not create site." };
  }
  return { ok: false, error: "Could not find an available subdomain. Try a different name." };
}
