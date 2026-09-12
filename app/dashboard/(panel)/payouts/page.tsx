import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PayoutsForm } from "@/components/dashboard/payouts-form";
import { PaymentOptions } from "@/components/dashboard/payment-options";
import { OtherSitePayouts, type SitePayout } from "@/components/dashboard/other-site-payouts";
import { siteLiveUrl } from "@/lib/site-url";
import { feePolicyForOwner } from "@/lib/plan-fees";
import { feeRateLabel, isFree } from "@/lib/platform-fee";
import { getPlan } from "@/lib/constants";

export const metadata = { title: "Payouts | Tomora" };

export default async function PayoutsPage() {
  const { site, sites } = await getDashboardData();
  // Stores, organisations, and any site that turned on donations settle to a bank.
  const needsPayout = site!.category === "ecommerce" || site!.category === "organization" || !!site!.site_data?.donationEnabled;
  if (!needsPayout) redirect("/dashboard");

  // Latest payout-change request (drives the request/approval gating in the form).
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: changeReq } = user
    ? await supabase
        .from("payout_change_requests")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  // The plan decides the transaction fee and whether bank transfer is offered.
  // Shown here so an owner is never surprised by either at their own checkout.
  const policy = await feePolicyForOwner(site!.user_id).catch(() => null);
  const feeNote = policy && !isFree(policy.rate)
    ? `Your ${getPlan(policy.planId)?.name || ""} plan adds a ${feeRateLabel(policy.rate)} transaction fee to each online payment. Your customer pays it on top of their total, so it never comes out of your sale.`
    : null;

  // Every website has its own payout bank, so the ones not being edited are
  // listed underneath: an owner who connected a bank on one site has no other
  // way to notice that another still cannot be paid.
  const others: SitePayout[] = sites
    .filter((s) => s.id !== site!.id)
    .map((s) => ({
      id: s.id,
      name: s.site_data?.businessName || s.subdomain,
      host: siteLiveUrl(s).replace(/^https?:\/\//, ""),
      bank: s.account_number ? `${s.bank_name || "Bank"} ${s.account_number}` : null,
      takesMoney: s.category === "ecommerce" || s.category === "organization" || !!s.site_data?.donationEnabled,
    }));

  return (
    <div className="space-y-6">
      <PayoutsForm
        changeStatus={(changeReq as { status: string } | null)?.status ?? null}
        siteName={site!.site_data?.businessName || site!.subdomain}
        siteHost={siteLiveUrl(site!).replace(/^https?:\/\//, "")}
        initial={{
          bankCode: site!.bank_code || "",
          bankName: site!.bank_name || "",
          accountNumber: site!.account_number || "",
          accountName: site!.account_name || "",
          connected: !!site!.paystack_subaccount,
        }}
      />

      {/* Payment methods a shopper can choose at checkout (ecommerce). */}
      {site!.category === "ecommerce" && (
        <PaymentOptions
          connected={!!site!.paystack_subaccount}
          transferAllowed={policy?.allowBankTransfer ?? true}
          feeNote={feeNote}
          initial={{
            paystack: site!.site_data?.paymentMethods?.paystack ?? true,
            transfer: site!.site_data?.paymentMethods?.transfer ?? true,
            feeBearer: site!.site_data?.feeBearer === "customer" ? "customer" : "owner",
          }}
        />
      )}

      {/* Fee bearer for donations (organisation / NGO sites). */}
      {site!.category !== "ecommerce" && (site!.category === "organization" || !!site!.site_data?.donationEnabled) && (
        <PaymentOptions
          donationOnly
          feeNote={feeNote}
          connected={!!site!.paystack_subaccount}
          initial={{
            paystack: true,
            transfer: false,
            feeBearer: site!.site_data?.feeBearer === "customer" ? "customer" : "owner",
          }}
        />
      )}

      <OtherSitePayouts sites={others} />

      {/* Store still in setup, guide them back into the rest of the flow. */}
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
