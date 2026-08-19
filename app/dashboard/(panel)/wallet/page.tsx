import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { WALLET_UNLIMITED_PLANS } from "@/lib/constants";
import { WalletManager, type WalletTx } from "@/components/dashboard/wallet-manager";
import { currentMode } from "@/lib/sandbox";

export const metadata = { title: "Tomora Wallet | Tomora" };

export default async function WalletPage() {
  const { site, subscription } = await getDashboardData();
  const eligible = site!.category === "ecommerce" || site!.category === "organization" || !!site!.site_data?.donationEnabled;
  if (!eligible) redirect("/dashboard");

  const supabase = createClient();
  // The balance a withdrawal is paid from: sandbox credits are never part of
  // it, and in test mode only sandbox credits are shown.
  const mode = await currentMode();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("id, type, source, amount, status, description, created_at")
    .eq("site_id", site!.id)
    .eq("is_test", mode === "test")
    .order("created_at", { ascending: false })
    .limit(200);
  const txs = (data as WalletTx[]) || [];

  const income = txs.filter((t) => t.type === "income" && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const out = txs.filter((t) => t.type === "withdrawal" && t.status !== "failed").reduce((s, t) => s + t.amount, 0);

  const planId = subscription?.status === "active" ? subscription.plan || "" : "";

  return (
    <WalletManager
      balance={income - out}
      totalIncome={income}
      totalWithdrawn={out}
      transactions={txs}
      unlimited={WALLET_UNLIMITED_PLANS.includes(planId)}
      bank={{
        accountNumber: site!.account_number,
        accountName: site!.account_name,
        bankName: site!.bank_name,
        connected: !!site!.account_number,
      }}
    />
  );
}
