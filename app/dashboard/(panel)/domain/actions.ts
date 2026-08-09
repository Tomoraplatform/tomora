"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentSiteId } from "@/lib/dashboard";
import { domainAccess } from "@/lib/domain-access";
import { NEW_DOMAIN_TLDS } from "@/lib/constants";
import { slugifySubdomain } from "@/lib/utils";
import { handleAvailable } from "@/lib/creator/handles";

const DOMAIN_RE = /^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/i;

/**
 * Activates a NEW domain that's included in the user's plan (Growth/Pro), no
 * payment. Creates a domain_request for an admin to register at the registrar,
 * just like the paid flow, but at ₦0.
 */
export async function activateIncludedDomain(domainRaw: string): Promise<{ ok: boolean; error?: string }> {
  const domain = domainRaw.trim().toLowerCase();
  const okTld = NEW_DOMAIN_TLDS.some((t) => domain.endsWith(`.${t}`));
  if (!okTld || !DOMAIN_RE.test(domain)) {
    return { ok: false, error: "That domain isn't available for activation." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  const siteId = await currentSiteId(user.id);
  if (!siteId) return { ok: false, error: "No site found." };

  const [{ data: sites }, { data: sub }] = await Promise.all([
    supabase.from("sites").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  const current = sites?.find((s: any) => s.id === siteId);
  const access = domainAccess({
    isPrimary: sites?.[0]?.id === siteId,
    domainPurchased: !!current?.domain_purchased,
    planId: sub?.plan,
    subActive: sub?.status === "active",
  });
  // Only when the plan genuinely includes a domain for this site.
  if (!access.included) {
    return { ok: false, error: "Your plan doesn't include a free domain for this site." };
  }
  // Don't hand out a second free domain if one is already set up.
  if (current?.custom_domain) {
    return { ok: false, error: "This site already has a domain connected." };
  }
  const admin = createAdminClient();
  const { data: existingReq } = await admin
    .from("domain_requests").select("id").eq("site_id", siteId).neq("status", "cancelled").maybeSingle();
  if (existingReq) {
    return { ok: false, error: "A domain request is already in progress for this site." };
  }

  await admin.from("domain_requests").insert({
    user_id: user.id, site_id: siteId, domain, amount: 0, reference: "included", status: "paid",
  });
  await admin.from("sites").update({ domain_purchased: true }).eq("id", siteId);
  revalidatePath("/dashboard/domain");
  return { ok: true };
}

export async function connectDomain(domainRaw: string): Promise<{ ok: boolean; error?: string }> {
  const domain = domainRaw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!DOMAIN_RE.test(domain)) return { ok: false, error: "Enter a valid domain, e.g. yourbrand.com" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const siteId = await currentSiteId(user.id);
  if (!siteId) return { ok: false, error: "No site found." };

  const [{ data: sites }, { data: sub }] = await Promise.all([
    supabase.from("sites").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  const current = sites?.find((s: any) => s.id === siteId);
  const access = domainAccess({
    isPrimary: sites?.[0]?.id === siteId,
    domainPurchased: !!current?.domain_purchased,
    planId: sub?.plan,
    subActive: sub?.status === "active",
  });
  if (!access.canConnect) {
    return { ok: false, error: "This site needs a custom domain. Buy the ₦8,000 domain add-on or upgrade to a plan that includes one." };
  }

  const site = { id: siteId };

  const { error: siteErr } = await supabase
    .from("sites")
    .update({ custom_domain: domain, domain_status: "pending" })
    .eq("id", site.id);
  if (siteErr) {
    if (siteErr.code === "23505") return { ok: false, error: "That domain is already connected to another site." };
    return { ok: false, error: siteErr.message };
  }

  // Upsert a domains row (one per site).
  const { data: existing } = await supabase
    .from("domains").select("id").eq("site_id", site.id).maybeSingle();
  if (existing) {
    await supabase.from("domains").update({ domain_name: domain, status: "pending" }).eq("id", existing.id);
  } else {
    await supabase.from("domains").insert({
      user_id: user.id, site_id: site.id, domain_name: domain, status: "pending",
    });
  }

  revalidatePath("/dashboard/domain");
  return { ok: true };
}

export async function removeDomain(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  const siteId = await currentSiteId(user.id);
  if (!siteId) return { ok: false, error: "No site found." };

  await supabase.from("sites").update({ custom_domain: null, domain_status: "none" }).eq("id", siteId);
  await supabase.from("domains").delete().eq("site_id", siteId);
  revalidatePath("/dashboard/domain");
  return { ok: true };
}

/**
 * Changes the site's free Tomora web address, before or after publishing.
 *
 * The name is checked against the same shared namespace a new site is: system
 * words, other sites and creator handles, so one address can never point at two
 * places. The old address stops working the moment this succeeds, which is why
 * the page says so before the owner saves.
 */
export async function changeSubdomain(
  raw: string
): Promise<{ ok: boolean; error?: string; subdomain?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  const siteId = await currentSiteId(user.id);
  if (!siteId) return { ok: false, error: "No site found." };

  const next = slugifySubdomain(raw);
  if (next.length < 3) {
    return { ok: false, error: "Use at least 3 characters: letters, numbers and dashes." };
  }

  const { data: site } = await supabase.from("sites").select("subdomain").eq("id", siteId).maybeSingle();
  if (site?.subdomain === next) return { ok: true, subdomain: next };

  const available = await handleAvailable(next);
  if (!available.ok) return { ok: false, error: available.error };

  const { error } = await supabase.from("sites").update({ subdomain: next }).eq("id", siteId);
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "That address is taken. Please choose another." : error.message,
    };
  }

  revalidatePath("/dashboard/domain");
  revalidatePath("/dashboard");
  return { ok: true, subdomain: next };
}
