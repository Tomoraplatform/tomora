"use client";

import { useState } from "react";
import { Package, Zap, Flame, Coins, Eye, Target, Lock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { saveGoals } from "@/app/dashboard/(panel)/milestones/actions";

interface Metrics {
  totalOrders: number;
  totalRevenue: number;
  visits: number;
  peakDay: number;
  peakWeek: number;
  peakMonth: number;
  longestStreak: number;
  maxMonthRevenue: number;
}

type Tier = { label: string; threshold: number; current: number };

/** One badge: grey + locked until earned, then coloured. */
function Medal({ tier, color, Icon }: { tier: Tier; color: string; Icon: typeof Package }) {
  const achieved = tier.current >= tier.threshold;
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl transition"
        style={achieved
          ? { background: `${color}1A`, boxShadow: `inset 0 0 0 2px ${color}` }
          : { background: "#F1F2F4", boxShadow: "inset 0 0 0 2px #E2E4E8" }}
      >
        <Icon className="h-7 w-7" style={{ color: achieved ? color : "#AEB3BB" }} strokeWidth={1.75} />
        <span
          className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
          style={{ background: achieved ? color : "#C2C6CD" }}
        >
          {achieved ? <Check className="h-3 w-3" /> : <Lock className="h-2.5 w-2.5" />}
        </span>
      </div>
      <p className={`text-xs font-semibold leading-tight ${achieved ? "text-ink" : "text-ink/40"}`}>{tier.label}</p>
    </div>
  );
}

function Section({ title, subtitle, color, Icon, tiers }: { title: string; subtitle: string; color: string; Icon: typeof Package; tiers: Tier[] }) {
  const earned = tiers.filter((t) => t.current >= t.threshold).length;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}1A`, color }}><Icon className="h-4 w-4" /></span>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-ink/50">{subtitle}</p>
            </div>
          </div>
          <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/60">{earned}/{tiers.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {tiers.map((t) => <Medal key={t.label} tier={t} color={color} Icon={Icon} />)}
        </div>
      </CardContent>
    </Card>
  );
}

function GoalBar({ label, current, goal, format }: { label: string; current: number; goal?: number; format: (n: number) => string }) {
  if (!goal || goal <= 0) return null;
  const pct = Math.min(100, Math.round((current / goal) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-ink/60">{format(current)} / {format(goal)}</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink/40">{pct}% of goal{pct >= 100 ? ", reached! 🎯" : ""}</p>
    </div>
  );
}

export function MilestonesGoals({ isEcommerce, metrics, goals }: { isEcommerce: boolean; metrics: Metrics; goals: { orders?: number; revenue?: number; visits?: number } }) {
  const [orders, setOrders] = useState(goals.orders || 0);
  const [revenue, setRevenue] = useState(goals.revenue || 0);
  const [visits, setVisits] = useState(goals.visits || 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true); setSaved(false);
    const res = await saveGoals({ orders, revenue, visits });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }

  const orderTiers: Tier[] = [
    ["First Order", 1], ["10 Orders", 10], ["50 Orders", 50], ["100 Orders", 100], ["200 Orders", 200], ["500 Orders", 500], ["1,000 Orders", 1000],
  ].map(([label, threshold]) => ({ label: label as string, threshold: threshold as number, current: metrics.totalOrders }));

  const exclusiveTiers: Tier[] = [
    { label: "10 in a day", threshold: 10, current: metrics.peakDay },
    { label: "20 in a day", threshold: 20, current: metrics.peakDay },
    { label: "50 in a day", threshold: 50, current: metrics.peakDay },
    { label: "100 in a day", threshold: 100, current: metrics.peakDay },
    { label: "500 in a day", threshold: 500, current: metrics.peakDay },
    { label: "1,000 in a week", threshold: 1000, current: metrics.peakWeek },
    { label: "2,000 in a month", threshold: 2000, current: metrics.peakMonth },
    { label: "5,000 in a month", threshold: 5000, current: metrics.peakMonth },
  ];

  const streakTiers: Tier[] = [7, 14, 21, 30, 50, 100, 250, 365].map((d) => ({ label: `${d}-day streak`, threshold: d, current: metrics.longestStreak }));

  const revenueTiers: Tier[] = [
    ["₦1M / month", 1_000_000], ["₦5M / month", 5_000_000], ["₦10M / month", 10_000_000], ["₦20M / month", 20_000_000], ["₦50M / month", 50_000_000], ["₦100M / month", 100_000_000],
  ].map(([label, threshold]) => ({ label: label as string, threshold: threshold as number, current: metrics.maxMonthRevenue }));

  const visitTiers: Tier[] = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000].map((v) => ({ label: `${v.toLocaleString()} visits`, threshold: v, current: metrics.visits }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Milestones &amp; Goals</h1>
        <p className="mt-1 text-ink/60">Track your progress and unlock badges as your business grows. Locked badges turn colourful once you earn them.</p>
      </div>

      {/* Manual goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/5 text-ink"><Target className="h-4 w-4" /></span>
            <CardTitle className="text-base">Your goals</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {isEcommerce && (
              <div className="space-y-1.5">
                <Label>Orders target</Label>
                <Input type="number" min={0} value={orders || ""} onChange={(e) => setOrders(Math.max(0, Math.round(Number(e.target.value) || 0)))} placeholder="e.g. 100" />
              </div>
            )}
            {isEcommerce && (
              <div className="space-y-1.5">
                <Label>Revenue target (₦)</Label>
                <Input type="number" min={0} value={revenue || ""} onChange={(e) => setRevenue(Math.max(0, Math.round(Number(e.target.value) || 0)))} placeholder="e.g. 1000000" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Website visits target</Label>
              <Input type="number" min={0} value={visits || ""} onChange={(e) => setVisits(Math.max(0, Math.round(Number(e.target.value) || 0)))} placeholder="e.g. 5000" />
            </div>
          </div>
          <div className="space-y-4">
            {isEcommerce && <GoalBar label="Orders" current={metrics.totalOrders} goal={orders} format={(n) => n.toLocaleString()} />}
            {isEcommerce && <GoalBar label="Revenue" current={metrics.totalRevenue} goal={revenue} format={formatNaira} />}
            <GoalBar label="Website visits" current={metrics.visits} goal={visits} format={(n) => n.toLocaleString()} />
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save goals"}
          </Button>
        </CardContent>
      </Card>

      {isEcommerce && <Section title="Order milestones" subtitle="Total completed orders" color="#D4A017" Icon={Package} tiers={orderTiers} />}
      {isEcommerce && <Section title="Exclusive milestones" subtitle="Your busiest day, week and month" color="#7C5CFF" Icon={Zap} tiers={exclusiveTiers} />}
      {isEcommerce && <Section title="Streaks" subtitle="Consecutive days with an order" color="#EA580C" Icon={Flame} tiers={streakTiers} />}
      {isEcommerce && <Section title="Revenue achievements" subtitle="Best single-month revenue" color="#0F9D76" Icon={Coins} tiers={revenueTiers} />}
      <Section title="Website visits" subtitle="Total visits to your live site" color="#2563EB" Icon={Eye} tiers={visitTiers} />
    </div>
  );
}
