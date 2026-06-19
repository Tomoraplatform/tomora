import { CheckCircle2, AlertCircle, Check } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/dashboard/upgrade-button";
import { PLANS, getPlan, nextCharge, RENEWAL_INTERVAL_MONTHS } from "@/lib/constants";
import { formatNaira } from "@/lib/utils";

export const metadata = { title: "Billing — Tomora" };

const PAID_PLANS = PLANS.filter((p) => p.id === "starter" || p.id === "growth" || p.id === "pro");

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { subscription } = await getDashboardData();
  const active = subscription?.status === "active";
  const pastDue = subscription?.status === "past_due";
  const currentPlan = getPlan(subscription?.plan || "");
  const isPro = currentPlan?.id === "pro";
  const position = subscription?.billing_cycle_position ?? 0;
  const proCharge = nextCharge(position);
  const nextAmount = isPro ? proCharge.amount : currentPlan?.renewal ?? currentPlan?.price ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Billing</h1>
        <p className="mt-1 text-ink/60">Choose a plan or manage your subscription.</p>
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
          <Badge variant={active ? "success" : "secondary"}>{active ? currentPlan?.name || "Active" : "Free Trial"}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {active ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Plan" value={currentPlan?.name || "—"} />
              <Stat label="Next amount" value={formatNaira(nextAmount)} />
              <Stat label="Next billing date" value={subscription?.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : "—"} />
              <Stat label="Last payment" value={subscription?.last_payment_date ? new Date(subscription.last_payment_date).toLocaleDateString() : "—"} />
              <div className="pt-2 sm:col-span-2">
                <UpgradeButton plan={currentPlan?.id} label={`Pay ${formatNaira(nextAmount)} now`} />
                {isPro && (
                  <p className="mt-2 text-xs text-ink/50">Cycle {position} of 3 · renews every {RENEWAL_INTERVAL_MONTHS} months.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-ink/70">
              You&apos;re on the free trial. Choose a plan below to keep your site online and unlock more features.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan options */}
      <div className="grid gap-6 lg:grid-cols-3">
        {PAID_PLANS.map((plan) => {
          const isCurrent = active && currentPlan?.id === plan.id;
          return (
            <Card key={plan.id} className={plan.popular ? "border-2 border-ink" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && <Badge>Popular</Badge>}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-ink">{formatNaira(plan.price!)}</span>
                  <span className="text-ink/50">/{plan.period}</span>
                </div>
                {plan.id === "pro" && (
                  <p className="text-xs text-ink/50">then {formatNaira(plan.renewal!)} every 4 months</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-ink/80">{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button disabled variant="outline" className="w-full">Current plan</Button>
                ) : (
                  <UpgradeButton plan={plan.id} label={plan.cta} variant={plan.popular ? "default" : "outline"} className="w-full" />
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
          <Button asChild variant="outline"><a href="mailto:tomoraplatform@gmail.com">Talk to us</a></Button>
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
