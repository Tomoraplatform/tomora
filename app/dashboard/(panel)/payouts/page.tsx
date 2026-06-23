import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { PayoutsForm } from "@/components/dashboard/payouts-form";

export const metadata = { title: "Payouts — Tomora" };

export default async function PayoutsPage() {
  const { site } = await getDashboardData();
  // Stores, organisations, and any site that turned on donations settle to a bank.
  const needsPayout = site!.category === "ecommerce" || site!.category === "organization" || !!site!.site_data?.donationEnabled;
  if (!needsPayout) redirect("/dashboard");

  return (
    <PayoutsForm
      initial={{
        bankCode: site!.bank_code || "",
        bankName: site!.bank_name || "",
        accountNumber: site!.account_number || "",
        accountName: site!.account_name || "",
        connected: !!site!.paystack_subaccount,
      }}
    />
  );
}
