"use client";

import { useMemo, useState } from "react";
import { Users, Globe, CreditCard, TrendingUp, Loader2, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils";
import { extendTrial, setSiteLive, grantPlan, revokePlan, setPlanDiscount, clearPlanDiscount, syncStoreCommission, deleteUserAccount, resetRevenue, updateTemplateSettings } from "@/app/admin/actions";
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
  rows, domains, stats, planDiscounts = {}, revenueResetAt = null,
  series = { signups: [], liveSites: [], subs: [], payments: [] },
  templateOverrides = {},
}: {
  rows: AdminUserRow[];
  domains: AdminDomainRow[];
  stats: { totalUsers: number; liveSites: number; activeSubs: number; estAnnualRevenue: number; monthly: Record<string, number> };
  planDiscounts?: Record<string, { percent: number; active: boolean }>;
  revenueResetAt?: string | null;
  series?: AdminSeries;
  templateOverrides?: Record<string, TemplateOverride>;
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
      <header className="flex items-center justify-between border-b border-ink/10 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Logo />
          <Badge>Admin</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy === "sync"}
            onClick={() => run("sync", async () => {
              const res = await syncStoreCommission();
              if (typeof window !== "undefined") window.alert(res.ok ? `Updated ${res.updated} store(s) to the current commission.` : (res.error || "Failed."));
            })}
          >
            {busy === "sync" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Sync store commission
          </Button>
          <Button asChild variant="outline" size="sm"><Link href="/dashboard">Back to app</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
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
            Revenue reset on {new Date(revenueResetAt).toLocaleDateString()} — only payments after that date are counted.
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
            <div className="overflow-x-auto">
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
                        <div className="flex flex-wrap items-center gap-1">
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
                          <Button size="sm" variant="outline" disabled={busy === r.userId + "b"}
                            onClick={() => run(r.userId + "b", () => grantPlan(r.userId, "basic", grantDays[r.userId] ?? 30))}>
                            {busy === r.userId + "b" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Grant Basic"}
                          </Button>
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

        {/* Domains */}
        <Card>
          <CardHeader><CardTitle>Domains</CardTitle></CardHeader>
          <CardContent className="p-0">
            {domains.length === 0 ? (
              <p className="p-5 text-sm text-ink/50">No custom domains connected yet.</p>
            ) : (
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
                    <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/10 p-3">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.accent }} />
                      <input
                        value={names[t.id] ?? ""}
                        onChange={(e) => setNames((n) => ({ ...n, [t.id]: e.target.value }))}
                        className="h-9 min-w-0 flex-1 rounded-md border border-ink/15 px-3 text-sm"
                      />
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

const DISCOUNTABLE = PLANS.filter((p) => p.id !== "trial" && p.id !== "custom");

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
              <div key={p.id} className="flex items-center gap-2 rounded-lg border border-ink/10 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-ink/50">
                    {active ? `${discounts[p.id].percent}% off active` : "No discount"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
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
