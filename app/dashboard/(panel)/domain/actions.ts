"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
import { domainAccess } from "@/lib/domain-access";

const DOMAIN_RE = /^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/i;

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
