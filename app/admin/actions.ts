"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { TRIAL_DAYS, getPlan } from "@/lib/constants";

async function guard() {
  if (!(await isAdmin())) throw new Error("Forbidden");
  return createAdminClient();
}

export async function extendTrial(siteId: string, days = TRIAL_DAYS): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await guard();
    const { data: site } = await admin.from("sites").select("trial_ends_at").eq("id", siteId).maybeSingle();
    const base = site?.trial_ends_at && new Date(site.trial_ends_at) > new Date()
      ? new Date(site.trial_ends_at) : new Date();
    base.setDate(base.getDate() + days);
    const { error } = await admin.from("sites").update({ trial_ends_at: base.toISOString(), is_live: true }).eq("id", siteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/**
 * Manually grant (comp) a user a paid plan without a Paystack payment.
 * Activates the subscription + their site. Used by admins to approve users
 * onto Basic or Starter.
 */
export async function grantPlan(
  userId: string,
  planId: "basic" | "starter"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await guard();
    const plan = getPlan(planId);
    if (!plan || plan.price == null) return { ok: false, error: "Invalid plan." };

    const now = new Date();
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);

    const { data: sub } = await admin
      .from("subscriptions").select("id").eq("user_id", userId).maybeSingle();

    const payload = {
      user_id: userId,
      status: "active" as const,
      plan: plan.id,
      billing_cycle_position: 0,
      first_payment_amount: plan.price,
      renewal_amount: plan.renewal ?? plan.price,
      next_billing_date: next.toISOString(),
      last_payment_date: now.toISOString(),
      last_reference: `admin_grant_${Date.now()}`,
    };

    const { error } = sub
      ? await admin.from("subscriptions").update(payload).eq("id", sub.id)
      : await admin.from("subscriptions").insert(payload);
    if (error) return { ok: false, error: error.message };

    // Bring the user's site online.
    await admin.from("sites").update({ is_live: true }).eq("user_id", userId);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/** Cancel a granted/active subscription (revoke comp). */
export async function revokePlan(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await guard();
    const { error } = await admin
      .from("subscriptions").update({ status: "cancelled" }).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

export async function setSiteLive(siteId: string, live: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await guard();
    const { error } = await admin.from("sites").update({ is_live: live }).eq("id", siteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/**
 * Fulfil an assisted domain purchase.
 *  - registered: bought at the registrar (DNS being pointed).
 *  - connected: live — also attaches the domain to the site so it routes.
 *  - cancelled: refunded / abandoned.
 */
export async function updateDomainRequest(
  id: string,
  status: "registered" | "connected" | "cancelled"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await guard();
    const { data: req } = await admin.from("domain_requests").select("*").eq("id", id).maybeSingle();
    if (!req) return { ok: false, error: "Request not found." };

    const { error } = await admin.from("domain_requests").update({ status }).eq("id", id);
    if (error) return { ok: false, error: error.message };

    if (status === "connected") {
      // Attach the domain to the site so middleware routes it. (Add it in
      // Vercel + point DNS first; this just flips the site to use it.)
      await admin.from("sites")
        .update({ custom_domain: req.domain, domain_status: "active" })
        .eq("id", req.site_id);
      const { data: existing } = await admin.from("domains").select("id").eq("site_id", req.site_id).maybeSingle();
      if (existing) await admin.from("domains").update({ domain_name: req.domain, status: "active" }).eq("id", existing.id);
      else await admin.from("domains").insert({ user_id: req.user_id, site_id: req.site_id, domain_name: req.domain, status: "active" });
    }
    revalidatePath("/admin");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}
