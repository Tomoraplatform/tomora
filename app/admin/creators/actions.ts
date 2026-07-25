"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { platformBalance, MIN_WITHDRAWAL } from "@/lib/creator/money";

async function guard() {
  if (!(await isAdmin())) throw new Error("Forbidden");
  return createAdminClient();
}

type R = { ok: boolean; error?: string };

/** Approves (or removes) a creator course from the main Tomora Academy catalog. */
export async function setCourseFeatured(courseId: string, featured: boolean): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("creator_courses")
      .update({ featured_at: featured ? new Date().toISOString() : null })
      .eq("id", courseId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/creators"); revalidatePath("/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/** Master switch: opens or closes Tomora Academy (creator pages included). */
export async function setAcademyOpen(open: boolean): Promise<R> {
  try {
    const admin = await guard();
    const { error } = await admin.from("app_settings").upsert({ id: 1, academy_open: open });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin"); revalidatePath("/academy");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/** Marks a creator payout paid (after sending the bank transfer). */
export async function markCreatorPayoutPaid(payoutId: string): Promise<R> {
  try {
    const admin = await guard();
    const { data: payout } = await admin.from("creator_payouts").select("*").eq("id", payoutId).maybeSingle();
    if (!payout) return { ok: false, error: "Payout not found." };
    await admin.from("creator_payouts").update({ status: "paid" }).eq("id", payoutId);
    // Flip the held withdrawal to completed.
    if (payout.note) {
      await admin.from("creator_wallet_transactions").update({ status: "completed" }).eq("reference", payout.note);
    }
    revalidatePath("/admin/creators");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/** Rejects a payout request and releases the held funds. */
export async function rejectCreatorPayout(payoutId: string): Promise<R> {
  try {
    const admin = await guard();
    const { data: payout } = await admin.from("creator_payouts").select("*").eq("id", payoutId).maybeSingle();
    if (!payout) return { ok: false, error: "Payout not found." };
    await admin.from("creator_payouts").update({ status: "rejected" }).eq("id", payoutId);
    if (payout.note) {
      // Remove the pending withdrawal so the balance is available again.
      await admin.from("creator_wallet_transactions").delete().eq("reference", payout.note).eq("type", "withdrawal");
    }
    revalidatePath("/admin/creators");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

/** Records a withdrawal from Tomora's own wallet. */
export async function withdrawPlatform(amount: number, note?: string): Promise<R> {
  try {
    const admin = await guard();
    const value = Math.round(amount || 0);
    if (value < MIN_WITHDRAWAL) return { ok: false, error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}.` };
    const { balance } = await platformBalance();
    if (value > balance) return { ok: false, error: "That's more than the available balance (VAT is held separately)." };

    const { error } = await admin.from("platform_wallet_transactions").insert({
      type: "withdrawal", source: "payout", amount: value, status: "completed",
      reference: `ppo_${Date.now()}`, description: note || "Admin withdrawal",
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/transactions");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}
