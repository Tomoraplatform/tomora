import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { Button } from "@/components/ui/button";
import { PayoutsForm } from "@/components/dashboard/payouts-form";

export const metadata = { title: "Payouts — Tomora" };

export default async function PayoutsPage() {
  const { site } = await getDashboardData();
  // Stores, organisations, and any site that turned on donations settle to a bank.
  const needsPayout = site!.category === "ecommerce" || site!.category === "organization" || !!site!.site_data?.donationEnabled;
  if (!needsPayout) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PayoutsForm
        initial={{
          bankCode: site!.bank_code || "",
          bankName: site!.bank_name || "",
          accountNumber: site!.account_number || "",
          accountName: site!.account_name || "",
          connected: !!site!.paystack_subaccount,
        }}
      />

      {/* Store still in setup — guide them back into the rest of the flow. */}
      {!site!.is_live && (
        <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-xl border border-ink/15 bg-cream/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">Continue setting up your store</p>
            <p className="text-sm text-ink/60">Next: trust badges, promo banner, then preview &amp; publish.</p>
          </div>
          <Button asChild><Link href="/onboarding">Continue <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      )}
    </div>
  );
}
