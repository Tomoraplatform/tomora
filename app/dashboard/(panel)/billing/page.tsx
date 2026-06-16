import { CheckCircle2, AlertCircle, Check } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton } from "@/components/dashboard/upgrade-button";
import {
  FIRST_PAYMENT_AMOUNT, RENEWAL_AMOUNT, RENEWAL_INTERVAL_MONTHS, nextCharge,
} from "@/lib/constants";
import { formatNaira } from "@/lib/utils";

export const metadata = { title: "Billing — Tomora" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { subscription } = await getDashboardData();
  const isPro = subscription?.status === "active";
  const pastDue = subscription?.status === "past_due";
  const position = subscription?.billing_cycle_position ?? 0;
  const charge = nextCharge(position);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Billing</h1>
        <p className="mt-1 text-ink/60">Manage your Tomora Pro plan.</p>
      </div>

      {searchParams.status === "success" && (
        <Banner ok>Payment successful. Your site is live and your plan is active.</Banner>
      )}
      {searchParams.status === "failed" && (
        <Banner>Payment was not completed. Please try again.</Banner>
      )}
      {pastDue && (
        <Banner>Your last payment failed. Settle it within the grace period to keep your site online.</Banner>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Current Plan</CardTitle>
          <Badge variant={isPro ? "success" : "secondary"}>{isPro ? "Pro" : "Free Trial"}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPro ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Cycle position" value={`${position} of 3`} />
              <Stat label="Next amount" value={formatNaira(charge.amount)} />
              <Stat label="Next billing date" value={subscription?.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : "—"} />
              <Stat label="Last payment" value={subscription?.last_payment_date ? new Date(subscription.last_payment_date).toLocaleDateString() : "—"} />
              <div className="sm:col-span-2 pt-2">
                <UpgradeButton label={`Pay ${formatNaira(charge.amount)} now`} />
                <p className="mt-2 text-xs text-ink/50">
                  {charge.includesDomain
                    ? "This payment includes another year of your custom domain."
                    : `Renewal of ${formatNaira(RENEWAL_AMOUNT)} every ${RENEWAL_INTERVAL_MONTHS} months.`}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-ink/70">
                Upgrade to Pro to keep your site online after the trial, connect a custom domain, and unlock priority support.
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  `First payment ${formatNaira(FIRST_PAYMENT_AMOUNT)} — includes 1 year custom domain`,
                  `Then ${formatNaira(RENEWAL_AMOUNT)} every ${RENEWAL_INTERVAL_MONTHS} months for 3 cycles`,
                  "After 3 renewals the cycle resets and the next payment is " + formatNaira(FIRST_PAYMENT_AMOUNT),
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span className="text-ink/80">{t}</span></li>
                ))}
              </ul>
              <UpgradeButton />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>How billing works</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-ink/70">
          <p>Your first Pro payment is {formatNaira(FIRST_PAYMENT_AMOUNT)} and includes one year of a custom domain.</p>
          <p>The next three payments are {formatNaira(RENEWAL_AMOUNT)} each, charged every {RENEWAL_INTERVAL_MONTHS} months.</p>
          <p>After the third renewal the cycle resets — your following payment returns to {formatNaira(FIRST_PAYMENT_AMOUNT)} and renews your domain for another year.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 p-4">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function Banner({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg p-4 text-sm ${ok ? "bg-emerald-50 text-emerald-800" : "bg-destructive/10 text-destructive"}`}>
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}
