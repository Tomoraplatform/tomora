"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SITE_COOKIE } from "@/lib/dashboard";
import { createCatalogContent, isCatalogTemplate, catalogTemplate, type CatalogCategoryId } from "@/lib/catalog";
import { getPlan } from "@/lib/constants";
import { slugifySubdomain } from "@/lib/utils";
import type { SiteCategory } from "@/lib/database.types";

function toDbCategory(cat: string): SiteCategory {
  const map: Record<CatalogCategoryId, SiteCategory> = {
    shop: "ecommerce", portfolio: "creator", education: "business",
    organization: "organization", events: "organization",
  };
  return map[cat as CatalogCategoryId] ?? "business";
}

/** Switch the active site shown across the dashboard. */
export async function setCurrentSite(siteId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: site } = await supabase
    .from("sites").select("id").eq("id", siteId).eq("user_id", user.id).maybeSingle();
  if (site) cookies().set(SITE_COOKIE, siteId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect("/dashboard");
}

export interface CreateSiteResult { ok: boolean; error?: string }

/** Create an additional site from a template, respecting the plan's site limit. */
export async function createAdditionalSite(templateId: string): Promise<CreateSiteResult> {
  if (!isCatalogTemplate(templateId)) return { ok: false, error: "Unknown template." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const [{ data: sites }, { data: sub }, { data: profile }] = await Promise.all([
    supabase.from("sites").select("id, subdomain").eq("user_id", user.id),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const count = sites?.length ?? 0;
  const planId = sub?.status === "active" ? sub?.plan || "pro" : "trial";
  const plan = getPlan(planId) ?? getPlan("trial")!;
  if (count >= plan.siteLimit) {
    return { ok: false, error: `Your ${plan.name} plan allows ${plan.siteLimit} site${plan.siteLimit > 1 ? "s" : ""}. Upgrade to add more.` };
  }

  const tpl = catalogTemplate(templateId)!;
  const businessName = profile?.business_name || "My New Site";
  const siteData = createCatalogContent(templateId, {
    businessName,
    brandColor: profile?.brand_color || "#022245",
    logoUrl: profile?.logo_url || undefined,
    tagline: profile?.tagline || undefined,
  });
  siteData.phone = profile?.phone || undefined;
  siteData.email = profile?.email || user.email || undefined;
  siteData.address = profile?.address || undefined;

  const base = slugifySubdomain(businessName) || "site";
  let subdomain = `${base}-${Math.floor(Math.random() * 9000 + 1000)}`;
  let createdId: string | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase
      .from("sites")
      .insert({
        user_id: user.id,
        template_id: templateId,
        category: toDbCategory(tpl.category),
        subdomain,
        domain_status: "none",
        is_live: false, // extra sites start as drafts
        site_data: siteData,
      })
      .select("id")
      .single();
    if (!error && data) { createdId = data.id; break; }
    if (error?.code === "23505") { subdomain = `${base}-${Math.floor(Math.random() * 90000 + 10000)}`; continue; }
    return { ok: false, error: error?.message || "Could not create site." };
  }
  if (!createdId) return { ok: false, error: "Could not find an available subdomain." };

  cookies().set(SITE_COOKIE, createdId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/dashboard");
  redirect("/dashboard/editor");
}
