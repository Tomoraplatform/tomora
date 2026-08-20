import "server-only";
import { scopeToMode } from "@/lib/orders/query";
import type { DataMode } from "@/lib/sandbox";
import type { AnalyticsData } from "@/components/dashboard/revenue-analytics";

/**
 * The figures behind the revenue dashboard, for one store in one world.
 *
 * Shared by the dashboard home, the revenue page and the sandbox, so the same
 * sale is never counted two different ways depending on which screen you are
 * looking at.
 */
export async function loadRevenue(
  supabase: { from: (t: string) => any },
  siteId: string,
  mode: DataMode,
  visits: number
): Promise<AnalyticsData> {
  const { data } = await scopeToMode(
    supabase
      .from("orders")
      .select("amount, status, created_at, buyer_email, buyer_phone, paystack_reference")
      .eq("site_id", siteId),
    mode
  );

  type Row = {
    amount: number; status: string; created_at: string;
    buyer_email: string | null; buyer_phone: string | null; paystack_reference: string | null;
  };
  const paidRows = ((data as Row[]) || []).filter((o) => o.status !== "pending");

  // Rows are one per item, so an "order" is a reference: counting rows would
  // treat a three-item basket as three sales.
  const byRef = new Map<string, { total: number; day: string; who: string }>();
  for (const o of paidRows) {
    const key = o.paystack_reference || `row:${o.created_at}`;
    const who = (o.buyer_email || o.buyer_phone || "").trim().toLowerCase();
    const found = byRef.get(key);
    if (found) found.total += o.amount || 0;
    else byRef.set(key, { total: o.amount || 0, day: o.created_at.slice(0, 10), who });
  }
  const sales = Array.from(byRef.values());
  const totalOrders = sales.length;
  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);

  // A continuous daily series, so a quiet day reads as a dip and not a gap.
  const revByDay = new Map<string, number>();
  const cntByDay = new Map<string, number>();
  for (const s of sales) {
    revByDay.set(s.day, (revByDay.get(s.day) || 0) + s.total);
    cntByDay.set(s.day, (cntByDay.get(s.day) || 0) + 1);
  }
  const revenueSeries: { label: string; value: number }[] = [];
  const ordersSeries: { label: string; value: number }[] = [];
  for (let i = 119; i >= 0; i--) {
    const key = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    revenueSeries.push({ label: key, value: revByDay.get(key) || 0 });
    ordersSeries.push({ label: key, value: cntByDay.get(key) || 0 });
  }

  const buyers = new Map<string, number>();
  for (const s of sales) if (s.who) buyers.set(s.who, (buyers.get(s.who) || 0) + 1);
  const repeat = Array.from(buyers.values()).filter((n) => n > 1).length;

  return {
    totalRevenue,
    totalOrders,
    averageOrder: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    visits,
    // Capped at 100: sandbox orders are written straight to the database
    // without anyone visiting the site, so the raw ratio can exceed every
    // visit and read as nonsense like 170%.
    conversionRate: visits > 0 ? Math.min(100, (totalOrders / visits) * 100) : 0,
    returningRate: buyers.size > 0 ? (repeat / buyers.size) * 100 : 0,
    revenueSeries,
    ordersSeries,
    visitsKnown: visits > 0,
  };
}
