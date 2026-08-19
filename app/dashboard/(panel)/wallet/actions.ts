"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentSiteId } from "@/lib/dashboard";
import { createTransferRecipient, initiateTransfer } from "@/lib/paystack";
import {
  WALLET_SINGLE_WITHDRAWAL_LIMIT,
  WALLET_DAILY_WITHDRAWAL_LIMIT,
  WALLET_UNLIMITED_PLANS,
} from "@/lib/constants";
import { formatNaira } from "@/lib/utils";

/**
 * Sums a site's wallet: income (completed) minus withdrawals (completed + pending).
 *
 * Real rows only, always. This is the figure a payout is paid against, so a
 * sandbox sale must never be able to add a naira to it.
 */
async function walletBalance(admin: ReturnType<typeof createAdminClient>, siteId: string) {
  const { data } = await admin
    .from("wallet_transactions")
    .select("type, amount, status, created_at")
    .eq("site_id", siteId)
    .eq("is_test", false);
  const rows = (data as { type: string; amount: number; status: string; created_at: string }[]) || [];
  const income = rows.filter((r) => r.type === "income" && r.status === "completed").reduce((s, r) => s + r.amount, 0);
  const out = rows.filter((r) => r.type === "withdrawal" && r.status !== "failed").reduce((s, r) => s + r.amount, 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const withdrawnToday = rows
    .filter((r) => r.type === "withdrawal" && r.status !== "failed" && r.created_at.slice(0, 10) === todayKey)
    .reduce((s, r) => s + r.amount, 0);
  return { balance: income - out, withdrawnToday };
}

/** Withdraws from the Tomora Wallet to the owner's connected bank via Paystack. */
export async function withdrawFromWallet(amountInput: number): Promise<{ ok: boolean; error?: string; pending?: boolean }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const siteId = await currentSiteId(user.id);
    if (!siteId) return { ok: false, error: "No site found." };

    const amount = Math.round(Number(amountInput) || 0);
    if (amount < 100) return { ok: false, error: "Enter an amount of at least ₦100." };

    const admin = createAdminClient();
    const { data: site } = await admin
      .from("sites")
      .select("id, user_id, bank_code, account_number, account_name, site_data")
      .eq("id", siteId)
      .maybeSingle();
    if (!site || site.user_id !== user.id) return { ok: false, error: "No site found." };
    if (!site.bank_code || !site.account_number) {
      return { ok: false, error: "Connect your payout bank first (Dashboard → Payouts)." };
    }

    // Plan-based limits: growth/pro/custom are unlimited.
    const { data: sub } = await admin
      .from("subscriptions").select("plan, status").eq("user_id", user.id).maybeSingle();
    const planId = sub?.status === "active" ? (sub.plan || "") : "";
    const unlimited = WALLET_UNLIMITED_PLANS.includes(planId);

    const { balance, withdrawnToday } = await walletBalance(admin, siteId);
    if (amount > balance) return { ok: false, error: `Insufficient balance, you have ${formatNaira(balance)} available.` };
    if (!unlimited) {
      if (amount > WALLET_SINGLE_WITHDRAWAL_LIMIT) {
        return { ok: false, error: `Your plan allows up to ${formatNaira(WALLET_SINGLE_WITHDRAWAL_LIMIT)} per withdrawal. Upgrade to Growth for unlimited withdrawals.` };
      }
      if (withdrawnToday + amount > WALLET_DAILY_WITHDRAWAL_LIMIT) {
        return { ok: false, error: `Daily limit reached, your plan allows ${formatNaira(WALLET_DAILY_WITHDRAWAL_LIMIT)} per day. Upgrade to Growth for unlimited withdrawals.` };
      }
    }

    const reference = `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Try the Paystack transfer; if Transfers isn't available yet, queue the
    // withdrawal for manual processing instead of failing.
    let status = "pending";
    let description = `Withdrawal to ${site.account_number}${site.account_name ? ` (${site.account_name})` : ""}`;
    try {
      const recipient = await createTransferRecipient({
        name: site.account_name || "Tomora user",
        accountNumber: site.account_number,
        bankCode: site.bank_code,
      });
      const transfer = await initiateTransfer({ amountNaira: amount, recipient, reference });
      status = transfer.status === "success" ? "completed" : "pending";
    } catch {
      description += ", queued, being processed by Tomora";
    }

    const { error } = await admin.from("wallet_transactions").insert({
      user_id: user.id,
      site_id: siteId,
      type: "withdrawal",
      source: "payout",
      amount,
      status,
      reference,
      description,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/wallet");
    return { ok: true, pending: status !== "completed" };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
