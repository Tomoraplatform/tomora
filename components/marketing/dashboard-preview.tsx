"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag, Wallet, Eye, ArrowUpRight, Bell } from "lucide-react";
import { Logo } from "@/components/logo";
import { formatNaira } from "@/lib/utils";

/**
 * Animated mock of the Tomora dashboard for the landing page, stat tiles
 * (orders / revenue / visits) count up once in view, a sparkline traces in,
 * and a short "recent activity" feed appends new rows to feel live. Entirely
 * decorative: no real data, no network calls.
 */
export function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); io.disconnect(); } },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const orders = useCountUp(active, 812, 1400);
  const revenue = useCountUp(active, 4_286_500, 1400);
  const visits = useCountUp(active, 15_940, 1400);

  const feed = useLiveFeed(active);

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl">
      {/* Dashboard top bar */}
      <div className="flex items-center justify-between border-b border-ink/10 bg-cream px-5 py-3">
        <Logo href={null} className="scale-90" />
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink/60 shadow-sm">
          <Bell className="h-3.5 w-3.5" /> Dashboard
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <StatTile icon={<ShoppingBag className="h-4 w-4" />} label="Orders this month" value={orders.toLocaleString()} delta="+18%" points={[4, 6, 5, 8, 7, 10, 12]} />
        <StatTile icon={<Wallet className="h-4 w-4" />} label="Revenue this month" value={formatNaira(revenue)} delta="+24%" points={[3, 5, 4, 7, 9, 8, 12]} />
        <StatTile icon={<Eye className="h-4 w-4" />} label="Website visits" value={visits.toLocaleString()} delta="+9%" points={[6, 5, 7, 6, 9, 8, 11]} />
      </div>

      {/* Live activity feed */}
      <div className="border-t border-ink/10 px-5 py-4">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink/40">Recent activity</p>
        <ul className="space-y-2">
          {feed.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-cream/60 px-3 py-2 text-sm animate-in fade-in slide-in-from-top-1">
              <span className="min-w-0 truncate text-ink/70">{item.text}</span>
              <span className="shrink-0 font-semibold text-ink">{item.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatTile({
  icon, label, value, delta, points,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  points: number[];
}) {
  return (
    // min-w-0 lets the tile shrink inside the grid; without it a grid item
    // keeps its content width and a long figure like ₦4,286,500 spills out
    // past the card edge.
    <div className="min-w-0 rounded-xl border border-ink/10 bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink">{icon}</span>
        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          <ArrowUpRight className="h-3 w-3" /> {delta}
        </span>
      </div>
      {/* Tabular figures keep the width steady while the number counts up. */}
      <p className="mt-3 truncate text-base font-bold tabular-nums leading-tight text-ink">{value}</p>
      <p className="truncate text-xs text-ink/45">{label}</p>
      <Sparkline points={points} />
    </div>
  );
}

/** Minimal single-series sparkline: thin rounded line + soft area fill, one brand hue. */
function Sparkline({ points }: { points: number[] }) {
  const w = 120, h = 32, pad = 2;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i * (w - pad * 2)) / (points.length - 1);
    const y = h - pad - ((p - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${h} ${line} ${w - pad},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-8 w-full" aria-hidden="true">
      <polygon points={area} fill="#022245" opacity={0.08} />
      <polyline points={line} fill="none" stroke="#022245" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r={2.5} fill="#022245" />
    </svg>
  );
}

/** Counts from 0 to `target` over `duration`ms once `start` flips true. */
function useCountUp(start: boolean, target: number, duration: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      // rAF reports the frame's start time, which can be marginally earlier
      // than the t0 captured just before scheduling it. Without the lower
      // clamp that first frame yields a negative progress, and the tiles
      // briefly render negative orders and revenue.
      const p = Math.min(1, Math.max(0, (t - t0) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return value;
}

const FEED_ITEMS = [
  { text: "New order: Ada's Kitchen", amount: "₦18,500" },
  { text: "New order: Bright Styles", amount: "₦42,000" },
  { text: "Donation received", amount: "₦5,000" },
  { text: "New order: Lagos Bakes", amount: "₦9,600" },
];

/** Cycles a few fake activity rows in, one at a time, to feel live. */
function useLiveFeed(active: boolean) {
  // Seeded with rows so the panel never renders an empty "recent activity".
  const [items, setItems] = useState<{ id: number; text: string; amount: string }[]>(() =>
    FEED_ITEMS.slice(0, 3).map((f, i) => ({ id: -1 - i, ...f }))
  );
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const push = () => {
      setItems((prev) => [{ id: i, ...FEED_ITEMS[i % FEED_ITEMS.length] }, ...prev].slice(0, 3));
      i += 1;
    };
    push();
    const id = setInterval(push, 2600);
    return () => clearInterval(id);
  }, [active]);
  return items;
}
