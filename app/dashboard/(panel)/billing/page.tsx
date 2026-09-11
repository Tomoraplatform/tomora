import { CheckCircle2, AlertCircle, Check } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/dashboard/upgrade-button";
import { PLANS, getPlan } from "@/lib/constants";
import { loadPlanDiscounts, discountedPrice } from "@/lib/discounts";
import { feePolicyForOwner, loadPlanFeeRates } from "@/lib/plan-fees";
import { feeRateLabel, isFree, transactionFeeLine } from "@/lib/platform-fee";
import { formatNaira } from "@/lib/utils";
import { SUPPORT_EMAIL } from "@/lib/support";

export const metadata = { title: "Billing | Tomora" };

const PAID_PLANS = PLANS.filter((p) => (p.price ?? 0) > 0);

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { subscription } = await getDashboardData();
  const [discounts, { rates }] = await Promise.all([loadPlanDiscounts(), loadPlanFeeRates()]);
  const active = subscription?.status === "active";
  const pastDue = subscription?.status === "past_due";
  const currentPlan = getPlan(subscription?.plan || "");
  const nextAmount = currentPlan?.renewal ?? currentPlan?.price ?? 0;
  // The merchant's own rate, which can differ from the plan's list rate when
  // they were paying before the fee launched.
  const policy = active && subscription?.user_id
    ? await feePolicyForOwner(subscription.user_id).catch(() => null)
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Billing</h1>
        <p className="mt-1 text-ink/60">
          Choose a plan or manage your subscription. Have a coupon code? Enter it at checkout.
        </p>
      </div>

      {searchParams.status === "success" && (
        <Banner ok>Payment successful. Your site is live and your plan is active.</Banner>
      )}
      {searchParams.status === "failed" && <Banner>Payment was not completed. Please try again.</Banner>}
      {pastDue && (
        <Banner>Your last payment failed. Settle it within the grace period to keep your site online.</Banner>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Current Plan</CardTitle>
          <Badge variant={active ? "success" : "secondary"}>{active ? currentPlan?.name || "Active" : "Free"}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {active ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Plan" value={currentPlan?.name || "—"} />
              <Stat label="Next amount" value={formatNaira(nextAmount)} />
              <Stat label="Next billing date" value={subscription?.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : "—"} />
              <Stat label="Last payment" value={subscription?.last_payment_date ? new Date(subscription.last_payment_date).toLocaleDateString() : "—"} />
              {policy && (
                <Stat label="Your transaction fee" value={isFree(policy.rate) ? "None" : feeRateLabel(policy.rate)} />
              )}
              <div className="pt-2 sm:col-span-2">
                <UpgradeButton plan={currentPlan?.id} planName={currentPlan?.name} label="Renew now" />
              </div>
            </div>
          ) : (
            <p className="text-ink/70">
              You&apos;re on the Free plan: one website, with a {feeRateLabel(rates.free)} transaction fee that your
              customers pay at checkout. Choose a plan below for more sites, a custom domain and a lower fee.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan options */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PAID_PLANS.map((plan) => {
          const isCurrent = active && currentPlan?.id === plan.id;
          return (
            <Card key={plan.id} className={plan.popular ? "border-2 border-ink" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="min-w-0 truncate">{plan.name}</CardTitle>
                  {plan.popular && <Badge className="shrink-0">Popular</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-1">
                  <span className="text-2xl font-bold text-ink sm:text-3xl">{formatNaira(discountedPrice(plan.price!, discounts[plan.id]))}</span>
                  {discounts[plan.id] ? (
                    <span className="text-sm text-ink/40 line-through">{formatNaira(plan.price!)}</span>
                  ) : null}
                  <span className="text-sm text-ink/50">/{plan.period}</span>
                </div>
                {discounts[plan.id] ? (
                  <Badge variant="success" className="mt-1">{discounts[plan.id]}% off</Badge>
                ) : null}
                {plan.id === "onetime" && (
                  <p className="text-xs text-ink/50">then only {formatNaira(plan.renewal!)}/year, domain renewal &amp; maintenance</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="min-w-0 break-words font-medium text-ink/80">{transactionFeeLine(rates[plan.id])}</span>
                  </li>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="min-w-0 break-words text-ink/80">{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button disabled variant="outline" className="w-full">Current plan</Button>
                ) : (
                  <UpgradeButton plan={plan.id} planName={plan.name} label={plan.cta} variant={plan.popular ? "default" : "outline"} className="w-full" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Need something custom?</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink/70">
            Custom features built and managed by a Tomora web expert.
          </p>
          <Button asChild variant="outline"><a href={`mailto:${SUPPORT_EMAIL}`}>Talk to us</a></Button>
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
