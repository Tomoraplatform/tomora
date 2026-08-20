import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { MilestonesGoals } from "@/components/dashboard/milestones";
import { scopeToMode } from "@/lib/orders/query";
import { currentMode } from "@/lib/sandbox";

export const metadata = { title: "Milestones & Goals | Tomora" };

const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
const monthKey = (iso: string) => new Date(iso).toISOString().slice(0, 7);
function weekKey(iso: string) {
  const d = new Date(iso);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export default async function MilestonesPage() {
  const { site } = await getDashboardData();
  const isEcommerce = site!.category === "ecommerce";
  const visits = Number((site as any)!.visit_count || 0);

  // Completed orders (anything the owner has confirmed as paid or beyond).
  const supabase = createClient();
  const mode = await currentMode();
  const { data: orderRows } = await scopeToMode(
    supabase.from("orders").select("amount, status, created_at, buyer_email, buyer_phone, paystack_reference").eq("site_id", site!.id),
    mode
  );
  type Row = {
    amount: number; status: string; created_at: string;
    buyer_email: string | null; buyer_phone: string | null; paystack_reference: string | null;
  };
  const orders = ((orderRows as Row[]) || []).filter((o) => o.status !== "pending");

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (o.amount || 0), 0);

  const perDay: Record<string, number> = {};
  const perWeek: Record<string, number> = {};
  const perMonth: Record<string, number> = {};
  const revPerMonth: Record<string, number> = {};
  for (const o of orders) {
    perDay[dayKey(o.created_at)] = (perDay[dayKey(o.created_at)] || 0) + 1;
    perWeek[weekKey(o.created_at)] = (perWeek[weekKey(o.created_at)] || 0) + 1;
    perMonth[monthKey(o.created_at)] = (perMonth[monthKey(o.created_at)] || 0) + 1;
    revPerMonth[monthKey(o.created_at)] = (revPerMonth[monthKey(o.created_at)] || 0) + (o.amount || 0);
  }
  const peakDay = Math.max(0, ...Object.values(perDay));
  const peakWeek = Math.max(0, ...Object.values(perWeek));
  const peakMonth = Math.max(0, ...Object.values(perMonth));
  const maxMonthRevenue = Math.max(0, ...Object.values(revPerMonth));

  // Longest run of consecutive days each having at least one order.
  const days = Object.keys(perDay).sort();
  let longestStreak = 0, run = 0;
  for (let i = 0; i < days.length; i++) {
    if (i === 0) run = 1;
    else {
      const prev = new Date(days[i - 1] + "T00:00:00Z").getTime();
      const cur = new Date(days[i] + "T00:00:00Z").getTime();
      run = cur - prev === 86_400_000 ? run + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, run);
  }

  // ---- Revenue analytics ----
  // Rows are one per item, so an "order" is a reference: counting rows would
  // treat a three-item basket as three sales.
  const byRef = new Map<string, { total: number; day: string; who: string }>();
  for (const o of orders) {
    const key = o.paystack_reference || `row:${o.created_at}`;
    const who = (o.buyer_email || o.buyer_phone || "").trim().toLowerCase();
    const found = byRef.get(key);
    if (found) found.total += o.amount || 0;
    else byRef.set(key, { total: o.amount || 0, day: dayKey(o.created_at), who });
  }
  const sales = Array.from(byRef.values());
  const orderCount = sales.length;
  const revenueTotal = sales.reduce((s, x) => s + x.total, 0);

  // A continuous daily series, so a quiet day is a dip rather than a gap.
  const revByDay = new Map<string, number>();
  const cntByDay = new Map<string, number>();
  for (const s2 of sales) {
    revByDay.set(s2.day, (revByDay.get(s2.day) || 0) + s2.total);
    cntByDay.set(s2.day, (cntByDay.get(s2.day) || 0) + 1);
  }
  const series: { label: string; revenue: number; orders: number }[] = [];
  for (let i = 119; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    series.push({ label: key, revenue: revByDay.get(key) || 0, orders: cntByDay.get(key) || 0 });
  }

  const buyers = new Map<string, number>();
  for (const s3 of sales) if (s3.who) buyers.set(s3.who, (buyers.get(s3.who) || 0) + 1);
  const repeat = Array.from(buyers.values()).filter((n) => n > 1).length;

  const analytics = {
    totalRevenue: revenueTotal,
    totalOrders: orderCount,
    averageOrder: orderCount ? Math.round(revenueTotal / orderCount) : 0,
    visits,
    conversionRate: visits > 0 ? (orderCount / visits) * 100 : 0,
    returningRate: buyers.size > 0 ? (repeat / buyers.size) * 100 : 0,
    revenueSeries: series.map((p) => ({ label: p.label, value: p.revenue })),
    ordersSeries: series.map((p) => ({ label: p.label, value: p.orders })),
    visitsKnown: visits > 0,
  };

  return (
    <MilestonesGoals isTest={mode === "test"}
      analytics={analytics}
      isEcommerce={isEcommerce}
      metrics={{ totalOrders, totalRevenue, visits, peakDay, peakWeek, peakMonth, longestStreak, maxMonthRevenue }}
      goals={site!.site_data?.goals || {}}
    />
  );
}
