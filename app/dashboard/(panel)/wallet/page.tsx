import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { WALLET_UNLIMITED_PLANS } from "@/lib/constants";
import { WalletManager, type WalletTx } from "@/components/dashboard/wallet-manager";
import { currentMode } from "@/lib/sandbox";

export const metadata = { title: "Payments received | Tomora" };

export default async function WalletPage() {
  const { site, subscription } = await getDashboardData();
  const eligible = site!.category === "ecommerce" || site!.category === "organization" || !!site!.site_data?.donationEnabled;
  if (!eligible) redirect("/dashboard");

  const supabase = createClient();
  // Money reaches the owner's bank straight from Paystack, so nothing here is
  // a balance Tomora can pay out. These rows are the record of what came in.
  const mode = await currentMode();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("id, type, source, amount, status, description, created_at")
    .eq("site_id", site!.id)
    .eq("is_test", mode === "test")
    .order("created_at", { ascending: false })
    .limit(200);
  const txs = (data as WalletTx[]) || [];

  // The owner can restart the running total; the history is never removed.
  const resetAt = site!.site_data?.walletResetAt || null;
  const since = resetAt ? new Date(resetAt).getTime() : 0;
  const received = txs
    .filter((t) => t.type === "income" && new Date(t.created_at).getTime() >= since)
    .reduce((s, t) => s + t.amount, 0);

  return (
    <WalletManager
      received={received}
      transactions={txs}
      resetAt={resetAt}
      bank={{
        accountNumber: site!.account_number,
        accountName: site!.account_name,
        bankName: site!.bank_name,
        connected: !!site!.account_number,
      }}
    />
  );
}
