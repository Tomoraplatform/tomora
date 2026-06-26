"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDefaultSiteData } from "@/lib/site-data";
import { createCatalogContent, isCatalogTemplate, catalogTemplate, type CatalogCategoryId } from "@/lib/catalog";
import { slugifySubdomain } from "@/lib/utils";
import { SITE_COOKIE } from "@/lib/dashboard";
import { TRIAL_DAYS } from "@/lib/constants";
import type { SiteCategory, SocialLinks, CatalogTestimonial } from "@/lib/database.types";

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

  // 2. Reuse an existing site if the user already has one (first onboarding only).
  const { data: existingList } = await supabase
    .from("sites")
    .select("id, subdomain")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);
  const existing = existingList?.[0] ?? null;

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

/**
 * Guided store builder — step 1: create the store as a DRAFT (not yet live) so
 * the following steps (payouts, products, content) can attach to a real site.
 * Sets the active-site cookie so saveProduct / savePayoutSettings target it.
 */
export async function createStoreDraft(payload: OnboardingPayload): Promise<OnboardingResult> {
  try {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be logged in." };
  if (!payload.businessName?.trim()) return { ok: false, error: "Business name is required." };
  if (!isCatalogTemplate(payload.templateId)) return { ok: false, error: "Unknown template." };

  await supabase.from("profiles").upsert({
    user_id: user.id,
    business_name: payload.businessName.trim(),
    tagline: payload.tagline || null,
    logo_url: payload.logoUrl || null,
    brand_color: payload.brandColor,
    email: payload.email || user.email,
    social_links: payload.social || {},
  }, { onConflict: "user_id" });

  const dbCategory = toDbCategory(catalogTemplate(payload.templateId)!.category);
  const siteData = createCatalogContent(payload.templateId, {
    businessName: payload.businessName.trim(),
    brandColor: payload.brandColor,
    logoUrl: payload.logoUrl,
    tagline: payload.tagline,
  });
  siteData.email = payload.email || user.email || undefined;
  siteData.social = payload.social;

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + TRIAL_DAYS);

  // Reuse the user's existing first site if onboarding was started before.
  const { data: existingList } = await supabase
    .from("sites").select("id, subdomain").eq("user_id", user.id)
    .order("created_at", { ascending: true }).limit(1);
  const existing = existingList?.[0] ?? null;

  if (existing) {
    const { error } = await supabase.from("sites").update({
      template_id: payload.templateId, category: dbCategory, site_data: siteData, is_live: false,
      trial_ends_at: trialEnds.toISOString(),
    }).eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    cookies().set(SITE_COOKIE, existing.id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return { ok: true, siteId: existing.id, subdomain: existing.subdomain };
  }

  const base = slugifySubdomain(payload.businessName) || "store";
  let subdomain = base;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase.from("sites").insert({
      user_id: user.id, template_id: payload.templateId, category: dbCategory,
      subdomain, domain_status: "none", is_live: false,
      trial_ends_at: trialEnds.toISOString(), site_data: siteData,
    }).select("id, subdomain").single();
    if (!error && data) {
      cookies().set(SITE_COOKIE, data.id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
      return { ok: true, siteId: data.id, subdomain: data.subdomain };
    }
    if (error?.code === "23505") { subdomain = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`; continue; }
    return { ok: false, error: error?.message || "Could not create store." };
  }
  return { ok: false, error: "Could not find an available address. Try a different name." };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not create store." };
  }
}

export interface FinalizeStoreInput {
  siteId: string;
  headline?: string;
  subheadline?: string;
  reviews?: { name: string; quote: string }[];
  heroImage?: string;
  heroImages?: string[];
  trustBadges?: { id: string; title: string; subtitle?: string }[];
  bannerImage?: string;
  donationEnabled?: boolean;
  donationGoal?: number;
  publish: boolean;
}

/** Guided store builder — final step: write the content into site_data and (optionally) publish. */
export async function finalizeStoreBuild(input: FinalizeStoreInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be logged in." };

  const { data: site } = await supabase
    .from("sites").select("id, site_data").eq("id", input.siteId).eq("user_id", user.id).maybeSingle();
  if (!site) return { ok: false, error: "Store not found." };

  const sd = { ...(site.site_data as any) };
  if (input.headline?.trim()) sd.heroHeadline = input.headline.trim();
  if (input.subheadline?.trim()) sd.heroSubtext = input.subheadline.trim();
  if (input.heroImage) sd.heroImage = input.heroImage;
  if (input.heroImages && input.heroImages.length) sd.heroImages = input.heroImages;
  if (input.trustBadges && input.trustBadges.length) sd.trustBadges = input.trustBadges;
  if (input.bannerImage) sd.sectionImages = { ...(sd.sectionImages || {}), banner: input.bannerImage };
  if (input.donationEnabled !== undefined) sd.donationEnabled = input.donationEnabled;
  if (input.donationGoal !== undefined) sd.donationGoal = Math.max(0, Math.round(input.donationGoal));
  if (input.reviews && input.reviews.length) {
    sd.testimonials = input.reviews
      .filter((r) => r.name?.trim() || r.quote?.trim())
      .map((r, i): CatalogTestimonial => ({ id: `rev-${i}`, name: r.name.trim() || "Customer", quote: r.quote.trim() }));
  }

  const update: Record<string, unknown> = { site_data: sd };
  if (input.publish) update.is_live = true;

  const { error } = await supabase.from("sites").update(update).eq("id", input.siteId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
