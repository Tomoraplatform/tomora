"use client";

import { useState } from "react";
import { Users, Globe, CreditCard, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils";
import { extendTrial, setSiteLive, grantPlan, revokePlan, setPlanDiscount, clearPlanDiscount } from "@/app/admin/actions";
import { PLANS } from "@/lib/constants";
import type { DomainStatus } from "@/lib/database.types";

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
}

export interface AdminDomainRow {
  domain: string;
  status: DomainStatus;
  expires: string;
}

export function AdminDashboard({
  rows, domains, stats, planDiscounts = {},
}: {
  rows: AdminUserRow[];
  domains: AdminDomainRow[];
  stats: { totalUsers: number; liveSites: number; activeSubs: number; estAnnualRevenue: number; monthly: Record<string, number> };
  planDiscounts?: Record<string, { percent: number; active: boolean }>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  // Per-row grant duration (days). 0 = no expiry.
  const [grantDays, setGrantDays] = useState<Record<string, number>>({});

  async function run(key: string, fn: () => Promise<any>) {
    setBusy(key);
    await fn();
    setBusy(null);
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center justify-between border-b border-ink/10 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Logo />
          <Badge>Admin</Badge>
        </div>
        <Button asChild variant="outline" size="sm"><Link href="/dashboard">Back to app</Link></Button>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total users" value={String(stats.totalUsers)} />
          <StatCard icon={<Globe className="h-5 w-5" />} label="Live sites" value={String(stats.liveSites)} />
          <StatCard icon={<CreditCard className="h-5 w-5" />} label="Active subscriptions" value={String(stats.activeSubs)} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Est. annual revenue" value={formatNaira(stats.estAnnualRevenue)} />
        </div>

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
                      <td className="p-3"><Badge variant={r.plan === "Trial" ? "warning" : (r.plan === "Offline" || r.plan === "No site") ? "secondary" : "success"}>{r.plan}</Badge></td>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

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
