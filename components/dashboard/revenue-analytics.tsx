"use client";

import { useState } from "react";
import { formatNaira, cn } from "@/lib/utils";

export interface AnalyticsPoint { label: string; value: number }

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrder: number;
  visits: number;
  conversionRate: number;
  returningRate: number;
  /** Oldest first. Empty until the store has made a sale. */
  revenueSeries: AnalyticsPoint[];
  ordersSeries: AnalyticsPoint[];
  visitsKnown: boolean;
}

/**
 * A sparkline drawn as one filled path, sized by its container rather than by
 * fixed pixels so a card can be any width on any screen without clipping.
 */
function Spark({ points, color = "#0f9d76" }: { points: AnalyticsPoint[]; color?: string }) {
  if (points.length < 2) {
    return (
      <div className="flex h-20 items-center justify-center rounded-md bg-ink/[0.03] text-xs text-ink/40">
        Not enough data yet
      </div>
    );
  }
  const W = 100, H = 34;
  const max = Math.max(...points.map((p) => p.value), 1);
  const step = W / (points.length - 1);
  const xy = points.map((p, i) => [i * step, H - (p.value / max) * (H - 4) - 2] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-20 w-full" role="img" aria-hidden="true">
      <path d={area} fill={color} opacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round"
        vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Card({
  title, value, sub, children,
}: {
  title: string;
  value: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    // min-w-0 lets long money values shrink instead of pushing the card wide,
    // which is what makes the grid safe on a phone.
    <div className="flex min-w-0 flex-col rounded-xl border border-ink/10 bg-white p-5">
      <p className="truncate text-sm font-medium text-ink/60">{title}</p>
      <p className="mt-1 truncate text-2xl font-bold text-ink sm:text-[28px]">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-ink/50">{sub}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

const RANGES = [
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "90", label: "Last 90 days", days: 90 },
  { id: "all", label: "All time", days: 0 },
] as const;

/**
 * The revenue dashboard: the numbers an owner actually checks, each with its
 * own shape over time, in a grid that reflows from three columns to one.
 */
export function RevenueAnalytics({
  data, isTest = false, manageHref,
}: {
  data: AnalyticsData;
  isTest?: boolean;
  /** Shown beside the heading, for getting from the figures to the controls. */
  manageHref?: string;
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("30");
  const days = RANGES.find((r) => r.id === range)!.days;
  const cut = (s: AnalyticsPoint[]) => (days ? s.slice(-days) : s);

  const revenue = cut(data.revenueSeries);
  const orders = cut(data.ordersSeries);
  const rangeRevenue = revenue.reduce((s, p) => s + p.value, 0);
  const rangeOrders = orders.reduce((s, p) => s + p.value, 0);
  const rangeAov = rangeOrders ? Math.round(rangeRevenue / rangeOrders) : 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-lg font-bold text-ink">{isTest ? "Sandbox revenue" : "Revenue"}</h2>
          {manageHref && (
            <a href={manageHref} className="text-sm font-semibold text-ink/60 underline hover:text-ink">
              Add or re-date test orders
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-ink/15 bg-white p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                range === r.id ? "bg-ink text-cream" : "text-ink/60 hover:text-ink"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card
          title={isTest ? "Sandbox sales" : "Total sales"}
          value={formatNaira(rangeRevenue)}
          sub={days ? `Over the last ${days} days` : "Since you opened"}
        >
          <Spark points={revenue} />
        </Card>

        <Card
          title="Orders"
          value={String(rangeOrders)}
          sub={`${data.totalOrders} all time`}
        >
          <Spark points={orders} color="#2563eb" />
        </Card>

        <Card
          title="Average order value"
          value={formatNaira(rangeAov)}
          sub={rangeOrders ? `Across ${rangeOrders} order${rangeOrders === 1 ? "" : "s"}` : "No orders in this range"}
        />

        <Card
          title="Store visits"
          value={data.visitsKnown ? data.visits.toLocaleString("en-NG") : "-"}
          sub={data.visitsKnown ? "All time" : "Not tracked yet"}
        />

        <Card
          title="Conversion rate"
          value={data.visitsKnown && data.visits > 0 ? `${data.conversionRate.toFixed(2)}%` : "-"}
          sub={isTest ? "Test orders are not visits, so treat this loosely" : "Visits that became an order"}
        />

        <Card
          title="Returning customers"
          value={data.totalOrders > 0 ? `${data.returningRate.toFixed(2)}%` : "-"}
          sub="Customers who ordered more than once"
        />
      </div>
    </section>
  );
}
