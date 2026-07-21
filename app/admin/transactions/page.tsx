import Link from "next/link";
import { ArrowLeft, ShoppingBag, HeartHandshake, CreditCard, Globe, TrendingUp, Layers } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/constants";
import { formatNaira } from "@/lib/utils";

export const metadata = { robots: { index: false, follow: false }, title: "Transactions | Admin | Tomora" };
export const dynamic = "force-dynamic";

const sum = (rows: { amount?: number | null }[] | null | undefined) =>
  (rows || []).reduce((s, r) => s + (r.amount || 0), 0);

export default async function AdminTransactionsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: orders }, { data: donations }, { data: subs }, { data: domainReqs }] = await Promise.all([
    admin.from("orders").select("amount, status, created_at").eq("status", "paid"),
    admin.from("donations").select("amount, status, created_at, project_name").eq("status", "paid"),
    admin.from("subscriptions").select("plan, status, last_payment_date, created_at"),
    admin.from("domain_requests").select("amount, status, domain, created_at"),
  ]);

  // ---- Platform volume (money processed for users: stores + donations) ----
  const storeTotal = sum(orders);
  const donationTotal = sum(donations);
  const platformVolume = storeTotal + donationTotal;

  // ---- Tomora revenue (subscriptions + domains) ----
  const paidSubs = (subs as { plan: string | null; last_payment_date: string | null }[] | null || [])
    .filter((s) => s.last_payment_date);
  const subRevenue = paidSubs.reduce((s, r) => s + (getPlan(r.plan || "")?.price ?? 0), 0);
  const paidDomains = (domainReqs as { amount: number | null; status: string }[] | null || [])
    .filter((d) => d.status !== "cancelled");
  const domainRevenue = sum(paidDomains);
  const tomoraRevenue = subRevenue + domainRevenue;

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="text-2xl font-bold text-ink">Transactions</h1>
        <p className="mt-1 text-ink/60">Money moving through Tomora, split by what belongs to your users and what is Tomora&apos;s own revenue.</p>

        {/* Section 1 — Platform transactions (users' money) */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-5 w-5 text-ink/70" />
            <h2 className="text-lg font-bold text-ink">Platform transactions</h2>
          </div>
          <p className="mb-4 text-sm text-ink/55">Payments processed on user sites. This money settles to the owners&apos; Tomora Wallets, not to Tomora.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat icon={TrendingUp} label="Total volume" value={formatNaira(platformVolume)} sub={`${(orders?.length || 0) + (donations?.length || 0)} transactions`} accent />
            <Stat icon={ShoppingBag} label="Store sales" value={formatNaira(storeTotal)} sub={`${orders?.length || 0} orders`} />
            <Stat icon={HeartHandshake} label="Donations" value={formatNaira(donationTotal)} sub={`${donations?.length || 0} gifts`} />
          </div>
        </section>

        {/* Section 2 — Tomora revenue */}
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-ink/70" />
            <h2 className="text-lg font-bold text-ink">Subscriptions &amp; domains</h2>
          </div>
          <p className="mb-4 text-sm text-ink/55">Tomora&apos;s own revenue from plan subscriptions and assisted domain purchases (figures shown before VAT).</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat icon={TrendingUp} label="Tomora revenue" value={formatNaira(tomoraRevenue)} sub={`${paidSubs.length + paidDomains.length} payments`} accent />
            <Stat icon={CreditCard} label="Subscriptions" value={formatNaira(subRevenue)} sub={`${paidSubs.length} paid`} />
            <Stat icon={Globe} label="Domains" value={formatNaira(domainRevenue)} sub={`${paidDomains.length} domains`} />
          </div>

          {paidDomains.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-xl border border-ink/10 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/50">
                  <tr><th className="px-4 py-2.5 font-semibold">Domain</th><th className="px-4 py-2.5 font-semibold">Status</th><th className="px-4 py-2.5 text-right font-semibold">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {(domainReqs as { amount: number | null; status: string; domain: string; created_at: string }[] || [])
                    .filter((d) => d.status !== "cancelled")
                    .slice(0, 12)
                    .map((d, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 font-medium text-ink">{d.domain}</td>
                        <td className="px-4 py-2.5 capitalize text-ink/60">{d.status}</td>
                        <td className="px-4 py-2.5 text-right text-ink">{formatNaira(d.amount || 0)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, accent = false }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "border-ink/15 bg-ink text-cream" : "border-ink/10 bg-white text-ink"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent ? "text-cream/70" : "text-ink/50"}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-cream/70" : "text-ink/50"}`}>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${accent ? "text-cream/60" : "text-ink/50"}`}>{sub}</p>}
    </div>
  );
}
