"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentSiteId } from "@/lib/dashboard";
import { storeCodeFrom } from "@/lib/live/config";

/**
 * Turning Tomora Live on and off for a seller's store.
 *
 * Activation is free and takes one click: Live is paid for by its commission,
 * so there is no plan to choose and nothing to buy here.
 */

async function requireSite() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  const siteId = await currentSiteId(user.id);
  if (!siteId) throw new Error("Create your store first, then activate Tomora Live.");
  return { userId: user.id, siteId };
}

/**
 * Picks a store code that is not taken.
 *
 * The subdomain is the natural choice and is already unique, but codes drop
 * ambiguous characters, so two different subdomains can collide. A numeric
 * suffix settles it.
 */
async function uniqueStoreCode(admin: ReturnType<typeof createAdminClient>, subdomain: string): Promise<string> {
  const base = storeCodeFrom(subdomain);
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = attempt === 0 ? base : `${base.slice(0, 10)}${attempt + 1}`;
    const { data } = await admin.from("live_accounts").select("id").eq("store_code", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base.slice(0, 6)}${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

export async function activateLive(): Promise<{ ok: boolean; error?: string; storeCode?: string }> {
  try {
    const { userId, siteId } = await requireSite();
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("live_accounts").select("store_code").eq("site_id", siteId).maybeSingle();
    if (existing) {
      await admin.from("live_accounts").update({ status: "active" }).eq("site_id", siteId);
      revalidatePath("/dashboard/live");
      return { ok: true, storeCode: existing.store_code };
    }

    const { data: site } = await admin.from("sites").select("subdomain").eq("id", siteId).maybeSingle();
    const storeCode = await uniqueStoreCode(admin, site?.subdomain || "store");

    const { error } = await admin.from("live_accounts").insert({
      user_id: userId, site_id: siteId, store_code: storeCode, status: "active",
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/live");
    return { ok: true, storeCode };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Stops Live taking orders without losing the store code or its history. */
export async function pauseLive(paused: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const { siteId } = await requireSite();
    const admin = createAdminClient();
    const { error } = await admin
      .from("live_accounts").update({ status: paused ? "paused" : "active" }).eq("site_id", siteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/live");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** The first thing a customer reads. Blank restores the default welcome. */
export async function saveGreeting(greeting: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { siteId } = await requireSite();
    const admin = createAdminClient();
    const { error } = await admin
      .from("live_accounts")
      .update({ greeting: greeting.trim().slice(0, 500) || null })
      .eq("site_id", siteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/live");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
