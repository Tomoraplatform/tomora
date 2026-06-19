import Link from "next/link";
import {
  Pencil, Palette, ExternalLink, Globe, CreditCard, Package, ShoppingBag,
  ArrowRight, CircleDot, LayoutTemplate,
} from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS, FIRST_PAYMENT_AMOUNT, RENEWAL_AMOUNT, nextCharge, getPlan } from "@/lib/constants";
import { siteLiveUrl } from "@/lib/site-url";
import { formatNaira } from "@/lib/utils";

export const metadata = { title: "Dashboard — Tomora" };

export default async function DashboardHome() {
  const { site, subscription, profile } = await getDashboardData();
  const supabase = createClient();

  let productCount = 0;
  let orderCount = 0;
  const isEcommerce = site?.category === "ecommerce";
  if (isEcommerce && site) {
    const [{ count: pc }, { count: oc }] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("site_id", site.id),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("site_id", site.id),
    ]);
    productCount = pc ?? 0;
    orderCount = oc ?? 0;
  }

  // ---- Status + trial ----
  const now = Date.now();
  const trialEnd = site?.trial_ends_at ? new Date(site.trial_ends_at).getTime() : 0;
  const isPro = subscription?.status === "active";
  const trialMsLeft = trialEnd - now;
  const daysLeft = Math.max(0, Math.ceil(trialMsLeft / 86400000));
  const onTrial = !isPro && site?.is_live && trialMsLeft > 0;
  const status = isPro ? "Live (Pro)" : onTrial ? "Trial" : "Offline";
  const statusVariant = isPro ? "success" : onTrial ? "warning" : "destructive";

  const liveUrl = siteLiveUrl(site!);
  const liveHost = liveUrl.replace(/^https?:\/\//, "");

  const charge = nextCharge(subscription?.billing_cycle_position ?? 0);
  const currentPlan = getPlan(subscription?.plan || "");
  const isProPlan = currentPlan?.id === "pro";
  const nextAmount = isProPlan ? charge.amount : (currentPlan?.renewal ?? currentPlan?.price ?? charge.amount);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Welcome back{profile?.business_name ? `, ${profile.business_name}` : ""}</h1>
        <p className="mt-1 text-ink/60">Here&apos;s how your site is doing.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Site status */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Site Status</CardTitle>
            <Badge variant={statusVariant as any}>
              <CircleDot className="mr-1 h-3 w-3" /> {status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href={liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-ink hover:underline">
              <Globe className="h-4 w-4 text-ink/50" /> {liveHost} <ExternalLink className="h-3.5 w-3.5 text-ink/40" />
            </a>

            {onTrial && (
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-ink/60">Free trial</span>
                  <span className="font-medium text-ink">{daysLeft} {daysLeft === 1 ? "day" : "days"} left</span>
                </div>
                <Progress value={Math.round(((TRIAL_DAYS - daysLeft) / TRIAL_DAYS) * 100)} />
              </div>
            )}
            {!isPro && !onTrial && (
              <p className="text-sm text-ink/60">Your trial has ended. Upgrade to bring your site back online.</p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm"><Link href="/dashboard/editor"><Pencil className="h-4 w-4" /> Edit Site</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/dashboard/preview" target="_blank">Preview</Link></Button>
              <Button asChild size="sm" variant="outline"><a href={liveUrl} target="_blank" rel="noreferrer">View Live</a></Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Subscription</CardTitle>
            <Badge variant={isPro ? "success" : "secondary"}>{isPro ? currentPlan?.name || "Active" : "Free Trial"}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPro ? (
              <>
                <Row label="Plan" value={currentPlan?.name || "—"} />
                <Row label="Next billing date" value={subscription?.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : "—"} />
                <Row label="Next amount" value={formatNaira(nextAmount)} />
                {isProPlan && <Row label="Cycle position" value={`${subscription?.billing_cycle_position ?? 0} of 3`} />}
                <Button asChild size="sm" variant="outline" className="mt-1"><Link href="/dashboard/billing">Manage Plan</Link></Button>
              </>
            ) : (
              <>
                <p className="text-sm text-ink/60">
                  Plans from {formatNaira(10000)}/month. Pro is {formatNaira(FIRST_PAYMENT_AMOUNT)} then {formatNaira(RENEWAL_AMOUNT)} every 4 months.
                </p>
                <Button asChild size="sm" className="mt-1"><Link href="/dashboard/billing"><CreditCard className="h-4 w-4" /> Choose a Plan</Link></Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/dashboard/editor" icon={<Pencil className="h-5 w-5" />} title="Edit Site" desc="Change content and layout" />
          <QuickAction href="/dashboard/templates" icon={<LayoutTemplate className="h-5 w-5" />} title="Templates" desc="Browse & add a website" />
          <QuickAction href="/dashboard/brand" icon={<Palette className="h-5 w-5" />} title="Brand Settings" desc="Colors, logo and details" />
          <QuickAction href="/dashboard/domain" icon={<Globe className="h-5 w-5" />} title="Custom Domain" desc="Connect your own domain" />
        </div>
      </div>

      {/* E-commerce */}
      {isEcommerce && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Store</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink/5 text-ink"><Package className="h-5 w-5" /></span>
                  <div><p className="text-2xl font-bold text-ink">{productCount}</p><p className="text-sm text-ink/60">Products</p></div>
                </div>
                <Button asChild size="sm" variant="ghost"><Link href="/dashboard/products">Manage <ArrowRight className="h-4 w-4" /></Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink/5 text-ink"><ShoppingBag className="h-5 w-5" /></span>
                  <div><p className="text-2xl font-bold text-ink">{orderCount}</p><p className="text-sm text-ink/60">Orders</p></div>
                </div>
                <Button asChild size="sm" variant="ghost"><Link href="/dashboard/orders">Manage <ArrowRight className="h-4 w-4" /></Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Link href="/dashboard/account" className="inline-block text-sm text-ink/50 hover:text-ink">Account settings</Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink/60">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-xl border border-ink/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink/5 text-ink">{icon}</span>
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="text-sm text-ink/60">{desc}</p>
      </div>
    </Link>
  );
}
