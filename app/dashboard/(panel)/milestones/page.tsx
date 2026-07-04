import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { MilestonesGoals } from "@/components/dashboard/milestones";

export const metadata = { title: "Milestones & Goals — Tomora" };

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
  const { data: orderRows } = await supabase
    .from("orders")
    .select("amount, status, created_at")
    .eq("site_id", site!.id);
  const orders = ((orderRows as { amount: number; status: string; created_at: string }[]) || [])
    .filter((o) => o.status !== "pending");

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

  return (
    <MilestonesGoals
      isEcommerce={isEcommerce}
      metrics={{ totalOrders, totalRevenue, visits, peakDay, peakWeek, peakMonth, longestStreak, maxMonthRevenue }}
      goals={site!.site_data?.goals || {}}
    />
  );
}
