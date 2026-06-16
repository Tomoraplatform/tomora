"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { TRIAL_DAYS } from "@/lib/constants";

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

export async function setSiteLive(siteId: string, live: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await guard();
    const { error } = await admin.from("sites").update({ is_live: live }).eq("id", siteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}
