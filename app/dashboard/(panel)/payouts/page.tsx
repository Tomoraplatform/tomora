import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { PayoutsForm } from "@/components/dashboard/payouts-form";

export const metadata = { title: "Payouts — Tomora" };

export default async function PayoutsPage() {
  const { site } = await getDashboardData();
  if (site!.category !== "ecommerce") redirect("/dashboard");

  return (
    <PayoutsForm
      initial={{
        paystackPublicKey: site!.paystack_public_key || "",
        bankName: site!.bank_name || "",
        accountNumber: site!.account_number || "",
        accountName: site!.account_name || "",
      }}
    />
  );
}
