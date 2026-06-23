import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { PayoutsForm } from "@/components/dashboard/payouts-form";

export const metadata = { title: "Payouts — Tomora" };

export default async function PayoutsPage() {
  const { site } = await getDashboardData();
  // Stores and organisations (donations) both settle to a payout bank.
  if (site!.category !== "ecommerce" && site!.category !== "organization") redirect("/dashboard");

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
