import Link from "next/link";
import {
  Pencil, Palette, ExternalLink, Globe, CreditCard, Package, ShoppingBag,
  ArrowRight, CircleDot, LayoutTemplate, LogOut,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TRIAL_DAYS, FIRST_PAYMENT_AMOUNT, RENEWAL_AMOUNT, RENEWAL_INTERVAL_MONTHS, nextCharge, getPlan } from "@/lib/constants";
import { siteLiveUrl } from "@/lib/site-url";
import { catalogTemplate } from "@/lib/catalog";
import { formatNaira } from "@/lib/utils";
import { GettingStarted } from "@/components/dashboard/getting-started";
import { MySites, type MySite } from "@/components/dashboard/my-sites";
import { currentMode } from "@/lib/sandbox";

export const metadata = { title: "Dashboard | Tomora" };

export default async function DashboardHome() {
  const { site, sites, subscription, profile } = await getDashboardData();
  const supabase = createClient();
  const mode = await currentMode();

  // Per-site product/order counts for the e-commerce website cards.
  const ecomIds = sites.filter((s) => s.category === "ecommerce").map((s) => s.id);
  const prodCounts: Record<string, number> = {};
  const orderCounts: Record<string, number> = {};
  if (ecomIds.length) {
    const [{ data: prodRows }, { data: orderRows }] = await Promise.all([
      supabase.from("products").select("site_id").in("site_id", ecomIds),
      supabase.from("orders").select("site_id").in("site_id", ecomIds).eq("is_test", mode === "test"),
    ]);
    for (const r of (prodRows as { site_id: string }[]) || []) prodCounts[r.site_id] = (prodCounts[r.site_id] || 0) + 1;
    for (const r of (orderRows as { site_id: string }[]) || []) orderCounts[r.site_id] = (orderCounts[r.site_id] || 0) + 1;
  }

  // All of the user's websites (live + draft) for the overview list.
  const mySites: MySite[] = sites.map((s) => {
    const url = siteLiveUrl(s);
    return {
      id: s.id,
      name: s.site_data?.businessName || s.subdomain,
      templateName: catalogTemplate(s.template_id)?.name || s.template_id,
      accent: catalogTemplate(s.template_id)?.accent || "#022245",
      isLive: !!s.is_live,
      isEcommerce: s.category === "ecommerce",
      isCurrent: s.id === site?.id,
      liveUrl: url,
      liveHost: url.replace(/^https?:\/\//, ""),
      productCount: prodCounts[s.id] || 0,
      orderCount: orderCounts[s.id] || 0,
    };
  });

  let productCount = 0;
  let orderCount = 0;
  const isEcommerce = site?.category === "ecommerce";
  if (isEcommerce && site) {
    const [{ count: pc }, { count: oc }] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("site_id", site.id),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("site_id", site.id).eq("is_test", mode === "test"),
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

  // ---- Store setup checklist (e-commerce) ----
  const sd = site?.site_data;
  const setupSteps = isEcommerce && site ? [
    { key: "brand", label: "Customize your store", desc: "Add your logo and brand color.", href: "/dashboard/editor", cta: "Customize",
      done: !!(sd?.logoUrl || profile?.logo_url) },
    { key: "product", label: "Add your first product", desc: "Upload a product with photos and a price.", href: "/dashboard/products", cta: "Add product",
      done: productCount > 0 },
    { key: "payouts", label: "Set up payouts", desc: "Add your bank account to receive payments.", href: "/dashboard/payouts", cta: "Set up",
      done: !!site.paystack_subaccount },
    { key: "contact", label: "Add your contact details", desc: "Phone, email and address for your customers.", href: "/dashboard/editor", cta: "Add details",
      done: !!(sd?.phone || sd?.email || sd?.address) },
    { key: "publish", label: "Publish your store", desc: "Take your store live for customers to visit.", href: "/dashboard/editor", cta: "Publish",
      done: !!site.is_live },
    { key: "sale", label: "Make your first sale", desc: "Share your store link and start selling.", href: liveUrl, cta: "View store",
      done: orderCount > 0 },
  ] : [];

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

      {setupSteps.length > 0 && <GettingStarted steps={setupSteps} siteId={site!.id} />}

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
                  Plans from {formatNaira(10000)}/month. Pro is {formatNaira(FIRST_PAYMENT_AMOUNT)} then {formatNaira(RENEWAL_AMOUNT)} every {RENEWAL_INTERVAL_MONTHS} months.
                </p>
                <Button asChild size="sm" className="mt-1"><Link href="/dashboard/billing"><CreditCard className="h-4 w-4" /> Choose a Plan</Link></Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All websites (live + draft) */}
      {mySites.length > 0 && <MySites sites={mySites} />}

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

      <div className="flex items-center gap-4 border-t border-ink/10 pt-6">
        <Link href="/dashboard/account" className="text-sm text-ink/50 hover:text-ink">Account settings</Link>
        <form action={signOut}>
          <button type="submit" className="flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </form>
      </div>
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
