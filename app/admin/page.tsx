import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminDashboard, type AdminUserRow, type AdminDomainRow } from "@/components/admin/admin-dashboard";
import { APP_DOMAIN, FIRST_PAYMENT_AMOUNT, RENEWAL_AMOUNT } from "@/lib/constants";
import type { Profile, Site, Subscription, Domain } from "@/lib/database.types";

export const metadata = { title: "Admin — Tomora" };

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: sites }, { data: subs }, { data: domains }] = await Promise.all([
    admin.from("profiles").select("*"),
    admin.from("sites").select("*"),
    admin.from("subscriptions").select("*"),
    admin.from("domains").select("*").order("created_at", { ascending: false }),
  ]);

  const siteByUser = new Map<string, Site>();
  (sites as Site[] | null)?.forEach((s) => siteByUser.set(s.user_id, s));
  const subByUser = new Map<string, Subscription>();
  (subs as Subscription[] | null)?.forEach((s) => subByUser.set(s.user_id, s));

  const now = Date.now();
  const rows: AdminUserRow[] = (profiles as Profile[] | null || []).map((p) => {
    const site = siteByUser.get(p.user_id);
    const sub = subByUser.get(p.user_id);
    const isPro = sub?.status === "active";
    const onTrial = !isPro && site?.is_live && site.trial_ends_at && new Date(site.trial_ends_at).getTime() > now;
    return {
      userId: p.user_id,
      siteId: site?.id || null,
      name: p.business_name || "—",
      email: p.email || "—",
      plan: isPro ? "Pro" : onTrial ? "Trial" : site ? "Offline" : "No site",
      domain: site
        ? site.custom_domain && site.domain_status === "active"
          ? site.custom_domain
          : `${site.subdomain}.${APP_DOMAIN}`
        : "—",
      trialEnd: site?.trial_ends_at ? new Date(site.trial_ends_at).toLocaleDateString() : "—",
      lastPayment: sub?.last_payment_date ? new Date(sub.last_payment_date).toLocaleDateString() : "—",
      isLive: !!site?.is_live,
    };
  });

  const activeSubs = (subs as Subscription[] | null)?.filter((s) => s.status === "active").length ?? 0;
  const liveSites = (sites as Site[] | null)?.filter((s) => s.is_live).length ?? 0;
  const estAnnualRevenue = activeSubs * (FIRST_PAYMENT_AMOUNT + 3 * RENEWAL_AMOUNT);

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

  return (
    <AdminDashboard
      rows={rows}
      domains={domainRows}
      stats={{
        totalUsers: profiles?.length ?? 0,
        liveSites,
        activeSubs,
        estAnnualRevenue,
        monthly,
      }}
    />
  );
}
