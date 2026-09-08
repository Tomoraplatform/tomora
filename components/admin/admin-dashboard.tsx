"use client";

import { useMemo, useState } from "react";
import { Users, Globe, CreditCard, TrendingUp, Loader2, RotateCcw, Trash2, Sparkles, GraduationCap, Store, Layers, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils";
import { extendTrial, setSiteLive, grantPlan, revokePlan, setPlanDiscount, clearPlanDiscount, syncStoreCommission, deleteUserAccount, resetRevenue, updateTemplateSettings, setNovaEnabled, createPlanCoupon, setPlanCouponActive, deletePlanCoupon } from "@/app/admin/actions";
import { setAcademyOpen } from "@/app/admin/creators/actions";
import { PLANS } from "@/lib/constants";
import { CATALOG_TEMPLATES, CATALOG_CATEGORIES } from "@/lib/catalog";
import type { DomainStatus } from "@/lib/database.types";

type TemplateOverride = { displayName?: string; archived?: boolean; removed?: boolean };

export interface AdminUserRow {
  userId: string;
  siteId: string | null;
  name: string;
  email: string;
  plan: string;
  domain: string;
  trialEnd: string;
  lastPayment: string;
  isLive: boolean;
  compExpires?: string | null;
}

export interface AdminDomainRow {
  domain: string;
  status: DomainStatus;
  expires: string;
}

type Period = "week" | "month" | "quarter" | "year" | "all";

const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
  { id: "quarter", label: "Quarterly" },
  { id: "year", label: "Yearly" },
  { id: "all", label: "All time" },
];

const PERIOD_DAYS: Record<Period, number | null> = {
  week: 7, month: 30, quarter: 90, year: 365, all: null,
};

interface AdminSeries {
  signups: string[];
  liveSites: string[];
  subs: string[];
  payments: { date: string; amount: number }[];
}

export function AdminDashboard({
  rows, domains, stats, planDiscounts = {}, planCoupons = [], revenueResetAt = null,
  series = { signups: [], liveSites: [], subs: [], payments: [] },
  templateOverrides = {},
  novaEnabled = false,
  academyOpen = true,
}: {
  rows: AdminUserRow[];
  domains: AdminDomainRow[];
  stats: { totalUsers: number; liveSites: number; activeSubs: number; estAnnualRevenue: number; monthly: Record<string, number> };
  planDiscounts?: Record<string, { percent: number; active: boolean }>;
  planCoupons?: AdminCouponRow[];
  revenueResetAt?: string | null;
  series?: AdminSeries;
  templateOverrides?: Record<string, TemplateOverride>;
  novaEnabled?: boolean;
  academyOpen?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  // Per-row grant duration (days). 0 = no expiry.
  const [grantDays, setGrantDays] = useState<Record<string, number>>({});
  const [period, setPeriod] = useState<Period>("all");

  async function run(key: string, fn: () => Promise<any>) {
    setBusy(key);
    await fn();
    setBusy(null);
  }

  // Stats for the selected period. Revenue also respects the reset baseline.
  const periodStats = useMemo(() => {
    const days = PERIOD_DAYS[period];
    const windowStart = days == null ? 0 : Date.now() - days * 86_400_000;
    const resetAt = revenueResetAt ? new Date(revenueResetAt).getTime() : 0;
    const revStart = Math.max(windowStart, resetAt);
    const inWindow = (iso: string) => new Date(iso).getTime() >= windowStart;

    const newSignups = series.signups.filter(inWindow).length;
    const newLiveSites = series.liveSites.filter(inWindow).length;
    const newSubs = series.subs.filter(inWindow).length;
    const revenue = series.payments
      .filter((p) => new Date(p.date).getTime() >= revStart)
      .reduce((sum, p) => sum + p.amount, 0);

    return { newSignups, newLiveSites, newSubs, revenue };
  }, [period, series, revenueResetAt]);

  const periodLabel = PERIODS.find((p) => p.id === period)!.label.toLowerCase();

  return (
    <div className="min-h-screen bg-cream">
      {/* Wraps onto as many rows as the screen needs: seven links do not fit
          across a phone, and a header that overflows drags the whole page
          sideways with it. */}
      <header className="border-b border-ink/10 bg-white px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge>Admin</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/transactions"><TrendingUp className="h-3.5 w-3.5" /> Transactions</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/creators"><Store className="h-3.5 w-3.5" /> Creators</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/academy"><GraduationCap className="h-3.5 w-3.5" /> Academy</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/tomivo"><Sparkles className="h-3.5 w-3.5" /> AI Designs</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/resources"><Layers className="h-3.5 w-3.5" /> Resources</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/support"><LifeBuoy className="h-3.5 w-3.5" /> Support</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy === "sync"}
              onClick={() => run("sync", async () => {
                const res = await syncStoreCommission();
                if (typeof window !== "undefined") window.alert(res.ok ? `Updated ${res.updated} store(s) to the current commission.` : (res.error || "Failed."));
              })}
            >
              {busy === "sync" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Sync commission
            </Button>
            <Button asChild variant="outline" size="sm"><Link href="/dashboard">Back to app</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-5 sm:py-8">
        {/* Period filter + revenue reset */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  period === p.id ? "bg-ink text-cream" : "bg-white text-ink/60 hover:text-ink border border-ink/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button
            variant={novaEnabled ? "default" : "outline"}
            size="sm"
            disabled={busy === "nova"}
            onClick={() => {
              run("nova", async () => {
                const res = await setNovaEnabled(!novaEnabled);
                if (typeof window !== "undefined" && !res.ok) window.alert(res.error || "Failed to update Nova.");
              });
            }}
          >
            {busy === "nova" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Nova AI: {novaEnabled ? "On" : "Off"}
          </Button>
          <Button
            variant={academyOpen ? "default" : "outline"}
            size="sm"
            disabled={busy === "academy"}
            onClick={() => {
              run("academy", async () => {
                const res = await setAcademyOpen(!academyOpen);
                if (typeof window !== "undefined" && !res.ok) window.alert(res.error || "Failed to update the Academy.");
              });
            }}
          >
            {busy === "academy" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GraduationCap className="h-3.5 w-3.5" />}
            Academy: {academyOpen ? "Open" : "Closed"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            disabled={busy === "resetrev"}
            onClick={() => {
              if (!confirm("Reset all revenue figures to zero? Revenue will only count payments received from now on. This can't be undone.")) return;
              run("resetrev", async () => {
                const res = await resetRevenue();
                if (typeof window !== "undefined" && !res.ok) window.alert(res.error || "Failed to reset revenue.");
              });
            }}
          >
            {busy === "resetrev" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Reset revenue to zero
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {period === "all" ? (
            <>
              <StatCard icon={<Users className="h-5 w-5" />} label="Total users" value={String(stats.totalUsers)} />
              <StatCard icon={<Globe className="h-5 w-5" />} label="Live sites" value={String(stats.liveSites)} />
              <StatCard icon={<CreditCard className="h-5 w-5" />} label="Active subscriptions" value={String(stats.activeSubs)} />
            </>
          ) : (
            <>
              <StatCard icon={<Users className="h-5 w-5" />} label={`New signups (${periodLabel})`} value={String(periodStats.newSignups)} />
              <StatCard icon={<Globe className="h-5 w-5" />} label={`New live sites (${periodLabel})`} value={String(periodStats.newLiveSites)} />
              <StatCard icon={<CreditCard className="h-5 w-5" />} label={`New subscriptions (${periodLabel})`} value={String(periodStats.newSubs)} />
            </>
          )}
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label={period === "all" ? "Revenue to date" : `Revenue (${periodLabel})`}
            value={formatNaira(periodStats.revenue)}
          />
        </div>
        {revenueResetAt && (
          <p className="-mt-5 text-xs text-ink/40">
            Revenue reset on {new Date(revenueResetAt).toLocaleDateString()}, only payments after that date are counted.
          </p>
        )}

        {/* Monthly breakdown */}
        <Card>
          <CardHeader><CardTitle>New subscriptions by month</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(stats.monthly).length === 0 ? (
              <p className="text-sm text-ink/50">No subscriptions yet.</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {Object.entries(stats.monthly).map(([month, count]) => (
                  <div key={month} className="rounded-lg border border-ink/10 px-4 py-3 text-center">
                    <div className="text-2xl font-bold text-ink">{count}</div>
                    <div className="text-xs text-ink/50">{month}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent className="p-0">
            {/* Phones get a card each. The table below needs 820px before it is
                readable, and sideways-scrolling a table to reach the controls
                is not something anyone should have to do on a phone. */}
            <div className="divide-y divide-ink/10 lg:hidden">
              {rows.map((r) => (
                <div key={r.userId} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{r.name}</p>
                      <p className="truncate text-xs text-ink/60">{r.email}</p>
                    </div>
                    <Badge variant={r.plan === "Trial" ? "warning" : (r.plan === "Offline" || r.plan === "No site") ? "secondary" : "success"}>{r.plan}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <Cell label="Domain" value={r.domain} wide />
                    <Cell label="Trial end" value={r.trialEnd} />
                    <Cell label="Last payment" value={r.lastPayment} />
                    {r.compExpires && <Cell label="Comp expires" value={r.compExpires} />}
                  </dl>
                  <UserControls
                    row={r} busy={busy} run={run}
                    grantDays={grantDays} setGrantDays={setGrantDays}
                  />
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-y border-ink/10 bg-cream/60 text-left text-ink/60">
                  <tr>
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium">Plan</th>
                    <th className="p-3 font-medium">Domain</th>
                    <th className="p-3 font-medium">Trial end</th>
                    <th className="p-3 font-medium">Last payment</th>
                    <th className="p-3 font-medium">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {rows.map((r) => (
                    <tr key={r.userId}>
                      <td className="p-3 font-medium text-ink">{r.name}</td>
                      <td className="p-3 text-ink/70">{r.email}</td>
                      <td className="p-3">
                        <Badge variant={r.plan === "Trial" ? "warning" : (r.plan === "Offline" || r.plan === "No site") ? "secondary" : "success"}>{r.plan}</Badge>
                        {r.compExpires && <p className="mt-1 text-[11px] text-ink/50">Comp expires {r.compExpires}</p>}
                      </td>
                      <td className="p-3 text-ink/70">{r.domain}</td>
                      <td className="p-3 text-ink/70">{r.trialEnd}</td>
                      <td className="p-3 text-ink/70">{r.lastPayment}</td>
                      <td className="p-3">
                        <UserControls
                          row={r} busy={busy} run={run}
                          grantDays={grantDays} setGrantDays={setGrantDays}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <TemplatesPanel overrides={templateOverrides} />

        {/* Plan discounts */}
        <PlanDiscounts discounts={planDiscounts} />

        {/* Subscription coupon codes */}
        <PlanCoupons coupons={planCoupons} />

        {/* Domains */}
        <Card>
          <CardHeader><CardTitle>Domains</CardTitle></CardHeader>
          <CardContent className="p-0">
            {domains.length === 0 ? (
              <p className="p-5 text-sm text-ink/50">No custom domains connected yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-ink/10 bg-cream/60 text-left text-ink/60">
                  <tr><th className="p-3 font-medium">Domain</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Expires</th></tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {domains.map((d) => (
                    <tr key={d.domain}>
                      <td className="p-3 font-medium text-ink">{d.domain}</td>
                      <td className="p-3"><Badge variant={d.status === "active" ? "success" : "warning"}>{d.status}</Badge></td>
                      <td className="p-3 text-ink/70">{d.expires}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TemplatesPanel({ overrides }: { overrides: Record<string, TemplateOverride> }) {
  const [names, setNames] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    CATALOG_TEMPLATES.forEach((t) => { v[t.id] = overrides[t.id]?.displayName || t.name; });
    return v;
  });
  const [busy, setBusy] = useState<string | null>(null);
  const catName = (id: string) => CATALOG_CATEGORIES.find((c) => c.id === id)?.name || id;

  async function run(key: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (typeof window !== "undefined" && !res.ok) window.alert(res.error || "Failed.");
  }

  return (
    <Card>
      <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p className="-mt-1 text-sm text-ink/50">
          Rename a template, <span className="font-medium">archive</span> it (hidden from new sign-ups, existing sites keep working), or <span className="font-medium">remove</span> it (hidden from onboarding). These don&apos;t affect sites already using a template.
        </p>
        {CATALOG_CATEGORIES.map((cat) => {
          const items = CATALOG_TEMPLATES.filter((t) => t.category === cat.id);
          if (!items.length) return null;
          return (
            <div key={cat.id}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">{cat.name}</h4>
              <div className="space-y-2">
                {items.map((t) => {
                  const ov = overrides[t.id] || {};
                  return (
                    // The name field keeps the whole width on a phone and the
                    // buttons drop below it; from sm up it is the single row
                    // it has always been.
                    <div key={t.id} className="rounded-lg border border-ink/10 p-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.accent }} />
                        <input
                          value={names[t.id] ?? ""}
                          onChange={(e) => setNames((n) => ({ ...n, [t.id]: e.target.value }))}
                          className="h-9 min-w-0 flex-1 rounded-md border border-ink/15 px-3 text-sm"
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0">
                        {ov.removed && <Badge variant="secondary">Removed</Badge>}
                        {ov.archived && !ov.removed && <Badge variant="warning">Archived</Badge>}
                        <Button size="sm" variant="outline" disabled={busy === t.id + "n"}
                          onClick={() => run(t.id + "n", () => updateTemplateSettings(t.id, { displayName: names[t.id] }))}>
                          {busy === t.id + "n" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save name"}
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy === t.id + "a"}
                          onClick={() => run(t.id + "a", () => updateTemplateSettings(t.id, { archived: !ov.archived }))}>
                          {busy === t.id + "a" ? <Loader2 className="h-3 w-3 animate-spin" /> : ov.archived ? "Unarchive" : "Archive"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" disabled={busy === t.id + "r"}
                          onClick={() => run(t.id + "r", () => updateTemplateSettings(t.id, { removed: !ov.removed }))}>
                          {busy === t.id + "r" ? <Loader2 className="h-3 w-3 animate-spin" /> : ov.removed ? "Restore" : "Remove"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink/5 text-ink">{icon}</span>
        <div>
          <p className="text-xl font-bold text-ink">{value}</p>
          <p className="text-xs text-ink/50">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** One labelled fact in a mobile user card. */
function Cell({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 min-w-0" : "min-w-0"}>
      <dt className="text-ink/45">{label}</dt>
      <dd className="truncate font-medium text-ink/80">{value}</dd>
    </div>
  );
}

/**
 * The per-user actions, shared by the desktop table cell and the mobile card
 * so the two can never drift apart. The buttons wrap, which is what lets the
 * same markup sit in a narrow card and a wide table column.
 */
function UserControls({
  row: r, busy, run, grantDays, setGrantDays,
}: {
  row: AdminUserRow;
  busy: string | null;
  run: (key: string, fn: () => Promise<unknown>) => void;
  grantDays: Record<string, number>;
  setGrantDays: (fn: (d: Record<string, number>) => Record<string, number>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        className="h-8 rounded-md border border-ink/15 bg-white px-1.5 text-xs"
        value={grantDays[r.userId] ?? 30}
        onChange={(e) => setGrantDays((d) => ({ ...d, [r.userId]: Number(e.target.value) }))}
        title="Comp duration"
      >
        <option value={30}>30 days</option>
        <option value={90}>90 days</option>
        <option value={180}>180 days</option>
        <option value={365}>1 year</option>
        <option value={0}>No expiry</option>
      </select>
      <Button size="sm" variant="outline" disabled={busy === r.userId + "s"}
        onClick={() => run(r.userId + "s", () => grantPlan(r.userId, "starter", grantDays[r.userId] ?? 30))}>
        {busy === r.userId + "s" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Grant Starter"}
      </Button>
      {r.siteId && (
        <>
          <Button size="sm" variant="outline" disabled={busy === r.userId + "t"}
            onClick={() => run(r.userId + "t", () => extendTrial(r.siteId!))}>
            {busy === r.userId + "t" ? <Loader2 className="h-3 w-3 animate-spin" /> : "+14d"}
          </Button>
          <Button size="sm" variant="outline" disabled={busy === r.userId + "a"}
            onClick={() => run(r.userId + "a", () => setSiteLive(r.siteId!, !r.isLive))}>
            {busy === r.userId + "a" ? <Loader2 className="h-3 w-3 animate-spin" /> : r.isLive ? "Disable" : "Activate"}
          </Button>
        </>
      )}
      <Button size="sm" variant="ghost" className="text-destructive" disabled={busy === r.userId + "r"}
        onClick={() => { if (confirm("Revoke this user's plan?")) run(r.userId + "r", () => revokePlan(r.userId)); }}>
        {busy === r.userId + "r" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Revoke"}
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" disabled={busy === r.userId + "d"} title="Delete account"
        onClick={() => {
          if (!confirm(`Permanently delete ${r.name} (${r.email}) and their site? They will have to sign up again as a new user. This can't be undone.`)) return;
          run(r.userId + "d", async () => {
            const res = await deleteUserAccount(r.userId);
            if (typeof window !== "undefined" && !res.ok) window.alert(res.error || "Failed to delete account.");
          });
        }}>
        {busy === r.userId + "d" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

const DISCOUNTABLE = PLANS.filter((p) => p.id !== "trial" && p.id !== "custom");

export interface AdminCouponRow {
  id: string;
  code: string;
  percent: number;
  planId: string | null;
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number | null;
  active: boolean;
  expiresAt: string | null;
  /** Preformatted on the server: formatting a date here instead would render
      one way on the server and another in the browser, breaking hydration. */
  expiresLabel: string | null;
  note: string | null;
}

const BLANK_COUPON = { code: "", percent: "20", planId: "", maxUses: "", perUserLimit: "1", expiresAt: "", note: "" };

/**
 * Coupon codes for Tomora's own plans.
 *
 * Different from the discounts above: those cut the price for everyone on the
 * pricing page, these only work for someone who was given the code, and are
 * entered at checkout.
 */
function PlanCoupons({ coupons }: { coupons: AdminCouponRow[] }) {
  const [form, setForm] = useState(BLANK_COUPON);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy("new");
    setError(null);
    const res = await createPlanCoupon({
      code: form.code,
      percent: Number(form.percent) || 0,
      planId: form.planId,
      maxUses: form.maxUses,
      perUserLimit: form.perUserLimit,
      expiresAt: form.expiresAt,
      note: form.note,
    });
    setBusy(null);
    if (!res.ok) { setError(res.error || "Could not create that code."); return; }
    setForm(BLANK_COUPON);
  }

  async function toggle(c: AdminCouponRow) {
    setBusy(c.id); await setPlanCouponActive(c.id, !c.active); setBusy(null);
  }

  async function remove(c: AdminCouponRow) {
    if (!confirm(`Delete ${c.code}? Its redemption history goes too.`)) return;
    setBusy(c.id); await deletePlanCoupon(c.id); setBusy(null);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Subscription coupon codes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-ink/50">
          A code takes a percentage off a subscription or renewal. Unlike the discounts above it is not
          shown anywhere: only someone you give the code to can use it, by typing it at checkout.
        </p>

        {/* ---- new code ---- */}
        <div className="grid gap-3 rounded-lg border border-ink/10 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Code">
            <input
              className="h-10 w-full rounded-md border border-ink/15 px-3 text-sm uppercase"
              placeholder="LAUNCH20"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Percent off">
            <input
              type="number" min={1} max={100}
              className="h-10 w-full rounded-md border border-ink/15 px-3 text-sm"
              value={form.percent}
              onChange={(e) => setForm({ ...form, percent: e.target.value })}
            />
          </Field>
          <Field label="Plan">
            <select
              className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm"
              value={form.planId}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
            >
              <option value="">Any plan</option>
              {DISCOUNTABLE.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Total uses" hint="Blank = unlimited">
            <input
              type="number" min={1}
              className="h-10 w-full rounded-md border border-ink/15 px-3 text-sm"
              placeholder="Unlimited"
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            />
          </Field>
          <Field label="Uses per person" hint="Blank = unlimited">
            <input
              type="number" min={1}
              className="h-10 w-full rounded-md border border-ink/15 px-3 text-sm"
              placeholder="Unlimited"
              value={form.perUserLimit}
              onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
            />
          </Field>
          <Field label="Expires" hint="Blank = never">
            <input
              type="date"
              className="h-10 w-full rounded-md border border-ink/15 px-3 text-sm"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Note" hint="For your reference only">
              <input
                className="h-10 w-full rounded-md border border-ink/15 px-3 text-sm"
                placeholder="Instagram launch campaign"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3">
            <Button onClick={create} disabled={busy === "new" || !form.code.trim()}>
              {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create code"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        {/* ---- existing codes ---- */}
        {coupons.length === 0 ? (
          <p className="text-sm text-ink/50">No coupon codes yet.</p>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => {
              const expired = !!c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
              const spent = c.maxUses != null && c.usedCount >= c.maxUses;
              const live = c.active && !expired && !spent;
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-ink/10 p-3">
                  {/* Full width on a phone so the details are not squeezed into
                      a sliver beside the buttons; beside them from sm up. */}
                  <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                    {/* A div, not a p: Badge renders a div, and a div inside a
                        p is invalid HTML that breaks hydration. */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-ink">{c.code}</span>
                      <Badge variant={live ? "success" : "secondary"}>
                        {live ? "Active" : expired ? "Expired" : spent ? "Fully claimed" : "Paused"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink/50">
                      {c.percent}% off {c.planId ? PLANS.find((p) => p.id === c.planId)?.name || c.planId : "any plan"}
                      {" · "}used {c.usedCount}{c.maxUses != null ? ` of ${c.maxUses}` : ""}
                      {c.perUserLimit != null ? ` · ${c.perUserLimit} per person` : ""}
                      {c.expiresLabel ? ` · expires ${c.expiresLabel}` : ""}
                      {c.note ? ` · ${c.note}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => toggle(c)}>
                    {busy === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : c.active ? "Pause" : "Resume"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={busy === c.id} onClick={() => remove(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink/60">
        {label}{hint && <span className="ml-1 font-normal text-ink/40">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function PlanDiscounts({ discounts }: { discounts: Record<string, { percent: number; active: boolean }> }) {
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    DISCOUNTABLE.forEach((p) => { v[p.id] = String(discounts[p.id]?.percent || ""); });
    return v;
  });
  const [busy, setBusy] = useState<string | null>(null);

  async function apply(id: string) {
    const pct = Number(vals[id]);
    if (!pct) return;
    setBusy(id); await setPlanDiscount(id, pct); setBusy(null);
  }
  async function remove(id: string) {
    setBusy(id + "x"); await clearPlanDiscount(id); setBusy(null);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Plan discounts</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-ink/50">Set a percentage discount on any plan. It shows on the pricing pages and is applied at checkout.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DISCOUNTABLE.map((p) => {
            const active = discounts[p.id]?.active && discounts[p.id]?.percent > 0;
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/10 p-3">
                <div className="min-w-[120px] flex-1">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-ink/50">
                    {active ? `${discounts[p.id].percent}% off active` : "No discount"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <input
                    type="number" min={0} max={100}
                    className="h-8 w-16 rounded-md border border-ink/15 px-2 text-sm"
                    placeholder="%"
                    value={vals[p.id] || ""}
                    onChange={(e) => setVals((v) => ({ ...v, [p.id]: e.target.value }))}
                  />
                  <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => apply(p.id)}>
                    {busy === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                  </Button>
                  {active && (
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={busy === p.id + "x"} onClick={() => remove(p.id)}>
                      {busy === p.id + "x" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Remove"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
