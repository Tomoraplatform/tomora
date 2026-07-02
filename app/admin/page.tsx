import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTemplateOverrides } from "@/lib/template-overrides";
import { AdminDashboard, type AdminUserRow, type AdminDomainRow } from "@/components/admin/admin-dashboard";
import { DomainRequestsPanel, type DomainRequestRow } from "@/components/admin/domain-requests";
import { PayoutRequestsPanel, type PayoutRequestRow } from "@/components/admin/payout-requests";
import { APP_DOMAIN, FIRST_PAYMENT_AMOUNT, RENEWAL_AMOUNT, getPlan } from "@/lib/constants";
import type { Profile, Site, Subscription, Domain, DomainRequest } from "@/lib/database.types";

export const metadata = { title: "Admin — Tomora" };

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: sites }, { data: subs }, { data: domains }, { data: domainReqs }, { data: discountRows }, { data: settings }] = await Promise.all([
    admin.from("profiles").select("*"),
    admin.from("sites").select("*"),
    admin.from("subscriptions").select("*"),
    admin.from("domains").select("*").order("created_at", { ascending: false }),
    admin.from("domain_requests").select("*").order("created_at", { ascending: false }),
    admin.from("plan_discounts").select("*"),
    admin.from("app_settings").select("revenue_reset_at").eq("id", 1).maybeSingle(),
  ]);

  const { data: payoutReqs } = await admin
    .from("payout_change_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const revenueResetAt = (settings as { revenue_reset_at: string | null } | null)?.revenue_reset_at ?? null;
  const templateOverrides = await getTemplateOverrides();

  const planDiscounts: Record<string, { percent: number; active: boolean }> = {};
  (discountRows as { plan_id: string; percent: number; active: boolean }[] | null)?.forEach((d) => {
    planDiscounts[d.plan_id] = { percent: d.percent, active: d.active };
  });

  const siteByUser = new Map<string, Site>();
  (sites as Site[] | null)?.forEach((s) => siteByUser.set(s.user_id, s));
  const subByUser = new Map<string, Subscription>();
  (subs as Subscription[] | null)?.forEach((s) => subByUser.set(s.user_id, s));

  const now = Date.now();
  const rows: AdminUserRow[] = (profiles as Profile[] | null || []).map((p) => {
    const site = siteByUser.get(p.user_id);
    const sub = subByUser.get(p.user_id);
    const activeSub = sub?.status === "active";
    const planName = activeSub ? getPlan(sub!.plan || "")?.name || "Active" : null;
    const onTrial = !activeSub && site?.is_live && site.trial_ends_at && new Date(site.trial_ends_at).getTime() > now;
    return {
      userId: p.user_id,
      siteId: site?.id || null,
      name: p.business_name || "—",
      email: p.email || "—",
      plan: planName || (onTrial ? "Trial" : site ? "Offline" : "No site"),
      domain: site
        ? site.custom_domain && site.domain_status === "active"
          ? site.custom_domain
          : `${site.subdomain}.${APP_DOMAIN}`
        : "—",
      trialEnd: site?.trial_ends_at ? new Date(site.trial_ends_at).toLocaleDateString() : "—",
      compExpires: activeSub && sub?.comp_expires_at ? new Date(sub.comp_expires_at).toLocaleDateString() : null,
      lastPayment: sub?.last_payment_date ? new Date(sub.last_payment_date).toLocaleDateString() : "—",
      isLive: !!site?.is_live,
    };
  });

  const activeSubs = (subs as Subscription[] | null)?.filter((s) => s.status === "active").length ?? 0;
  const liveSites = (sites as Site[] | null)?.filter((s) => s.is_live).length ?? 0;
  const estAnnualRevenue = activeSubs * (FIRST_PAYMENT_AMOUNT + 3 * RENEWAL_AMOUNT);

  // Dated event series so the dashboard can filter stats by period
  // (weekly/monthly/quarterly/yearly) on the client.
  const signups = (profiles as Profile[] | null || [])
    .map((p) => p.created_at)
    .filter(Boolean) as string[];
  const liveSiteDates = (sites as Site[] | null || [])
    .filter((s) => s.is_live)
    .map((s) => s.created_at)
    .filter(Boolean) as string[];
  const subDates = (subs as Subscription[] | null || [])
    .map((s) => s.created_at)
    .filter(Boolean) as string[];
  // Real payment events: subscriptions that have actually paid (have a payment
  // date). Amount uses the plan's price as the representative payment.
  const payments = (subs as Subscription[] | null || [])
    .filter((s) => s.last_payment_date)
    .map((s) => ({
      date: s.last_payment_date as string,
      amount: getPlan(s.plan || "")?.price ?? FIRST_PAYMENT_AMOUNT,
    }));

  // Monthly breakdown of new subscriptions.
  const monthly: Record<string, number> = {};
  (subs as Subscription[] | null)?.forEach((s) => {
    const d = new Date(s.created_at);
    const key = d.toLocaleString("en-US", { month: "short", year: "numeric" });
    monthly[key] = (monthly[key] || 0) + 1;
  });

  const domainRows: AdminDomainRow[] = (domains as Domain[] | null || []).map((d) => ({
    domain: d.domain_name,
    status: d.status,
    expires: d.expires_at ? new Date(d.expires_at).toLocaleDateString() : "—",
  }));

  const profileByUser = new Map<string, Profile>();
  (profiles as Profile[] | null)?.forEach((p) => profileByUser.set(p.user_id, p));
  const requestRows: DomainRequestRow[] = (domainReqs as DomainRequest[] | null || []).map((r) => ({
    id: r.id,
    domain: r.domain,
    status: r.status,
    amount: r.amount,
    business: profileByUser.get(r.user_id)?.business_name || "—",
    email: profileByUser.get(r.user_id)?.email || "—",
    createdAt: new Date(r.created_at).toLocaleDateString(),
  }));

  const payoutRows: PayoutRequestRow[] = (payoutReqs as { id: string; user_id: string; proof_url: string | null; note: string | null; status: string; created_at: string }[] | null || []).map((r) => ({
    id: r.id,
    business: profileByUser.get(r.user_id)?.business_name || "—",
    email: profileByUser.get(r.user_id)?.email || "—",
    proofUrl: r.proof_url,
    note: r.note,
    status: r.status,
    createdAt: new Date(r.created_at).toLocaleDateString(),
  }));

  return (
    <>
      <AdminDashboard
        rows={rows}
        domains={domainRows}
        planDiscounts={planDiscounts}
        templateOverrides={templateOverrides}
        revenueResetAt={revenueResetAt}
        series={{ signups, liveSites: liveSiteDates, subs: subDates, payments }}
        stats={{
          totalUsers: profiles?.length ?? 0,
          liveSites,
          activeSubs,
          estAnnualRevenue,
          monthly,
        }}
      />
      <DomainRequestsPanel requests={requestRows} />
      <PayoutRequestsPanel requests={payoutRows} />
    </>
  );
}
