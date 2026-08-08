"use client";

import { Fragment, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatNaira, cn } from "@/lib/utils";
import { updateOrderStatus } from "@/app/dashboard/store-actions";
import type { Order, OrderStatus } from "@/lib/database.types";
import { orderCode } from "@/lib/restaurant/order";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered"];
type Filter = "all" | OrderStatus;

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting transfer",
  paid: "Paid",
  shipped: "Sent out",
  delivered: "Fulfilled",
};
const STATUS_PILL: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-700",
  shipped: "bg-sky-100 text-sky-700",
  delivered: "bg-ink/10 text-ink/70",
};

/**
 * One customer order is stored as a row per item, so the rows are grouped back
 * into the order the customer actually placed. The heading is the short order
 * code the customer was shown, which is what they will quote on the phone.
 */
interface Grouped {
  key: string;
  code: string;
  rows: Order[];
  total: number;
  status: OrderStatus;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_address: string | null;
}

function groupOrders(orders: Order[]): Grouped[] {
  const map = new Map<string, Order[]>();
  for (const o of orders) {
    // Orders placed before references existed fall back to their own row.
    const k = o.paystack_reference || `row:${o.id}`;
    map.set(k, [...(map.get(k) || []), o]);
  }
  return Array.from(map.entries()).map(([key, rows]) => {
    const first = rows[0];
    return {
      key,
      code: key.startsWith("row:") ? first.id.slice(0, 8).toUpperCase() : orderCode(key),
      rows,
      total: rows.reduce((n, r) => n + r.amount, 0),
      status: first.status,
      created_at: first.created_at,
      buyer_name: first.buyer_name,
      buyer_email: first.buyer_email,
      buyer_phone: first.buyer_phone,
      buyer_address: first.buyer_address,
    };
  }).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export function OrdersManager({ initial, productNames }: { initial: Order[]; productNames: Record<string, string> }) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  /** Status applies to every row of the order, not just one item. */
  async function changeGroup(g: Grouped, status: OrderStatus) {
    const ids = new Set(g.rows.map((r) => r.id));
    setOrders((os) => os.map((o) => (ids.has(o.id) ? { ...o, status } : o)));
    await Promise.all(g.rows.map((r) => updateOrderStatus(r.id, status)));
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length, pending: 0, paid: 0, shipped: 0, delivered: 0 };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const grouped = useMemo(() => groupOrders(orders), [orders]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    return grouped.filter((g) => {
      if (filter !== "all" && g.status !== filter) return false;
      if (!q) return true;
      return (
        g.code.toLowerCase().replace(/^#/, "").includes(q) ||
        g.buyer_name.toLowerCase().includes(q) ||
        (g.buyer_email || "").toLowerCase().includes(q) ||
        (g.buyer_phone || "").includes(q)
      );
    });
  }, [grouped, filter, query]);
  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Awaiting transfer" },
    { key: "paid", label: "Paid" },
    { key: "shipped", label: "Sent out" },
    { key: "delivered", label: "Fulfilled" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <p className="mt-1 text-ink/60">Customers pay by bank transfer, mark an order <span className="font-medium">Paid</span> once the money lands in your account.</p>
      </div>

      {counts.pending > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have <span className="font-semibold">{counts.pending}</span> order{counts.pending > 1 ? "s" : ""} awaiting payment confirmation.
        </div>
      )}

      <label className="flex max-w-sm items-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-ink/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order code, name, email or phone"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
        />
      </label>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              filter === t.key ? "bg-ink text-cream" : "bg-ink/5 text-ink/70 hover:bg-ink/10"
            )}
          >
            {t.label} <span className="opacity-60">({counts[t.key] ?? 0})</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 p-12 text-center text-ink/50">
          {filter === "all" ? "No orders yet." : `No ${tabs.find((t) => t.key === filter)?.label.toLowerCase()} orders.`}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-ink/10 bg-cream/60 text-left text-ink/60">
              <tr>
                <th className="p-4 font-medium">Order code</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium">Buyer</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {visible.map((g) => (
                <Fragment key={g.key}>
                  <tr className={g.status === "pending" ? "bg-amber-50/40" : undefined}>
                    <td className="p-4">
                      <button
                        onClick={() => setOpen(open === g.key ? null : g.key)}
                        className="font-mono text-xs font-semibold text-ink hover:underline"
                      >
                        {g.code}
                      </button>
                    </td>
                    <td className="p-4 text-ink/80">
                      <button onClick={() => setOpen(open === g.key ? null : g.key)} className="text-left">
                        {g.rows.length} item{g.rows.length === 1 ? "" : "s"}
                        <span className="ml-1 text-xs text-ink/45">
                          {open === g.key ? "hide" : "view"}
                        </span>
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="text-ink">{g.buyer_name}</div>
                      <div className="text-xs text-ink/50">{g.buyer_email}</div>
                      {g.buyer_phone && <div className="text-xs text-ink/50">{g.buyer_phone}</div>}
                    </td>
                    <td className="p-4 font-medium text-ink">{formatNaira(g.total)}</td>
                    <td className="p-4 text-ink/60">{new Date(g.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_PILL[g.status])}>{STATUS_LABEL[g.status]}</span>
                        {g.status === "pending" ? (
                          <Button size="sm" className="h-7" onClick={() => changeGroup(g, "paid")}>
                            <Check className="h-3.5 w-3.5" /> Mark paid
                          </Button>
                        ) : (
                          <Select value={g.status} onValueChange={(v) => changeGroup(g, v as OrderStatus)}>
                            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((st) => (
                                <SelectItem key={st} value={st}><span className="capitalize">{st === "pending" ? "Awaiting transfer" : st}</span></SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </td>
                  </tr>

                  {open === g.key && (
                    <tr className="bg-cream/60">
                      <td colSpan={6} className="px-4 pb-4">
                        <ul className="divide-y divide-ink/5 rounded-lg border border-ink/10 bg-white">
                          {g.rows.map((r) => (
                            <li key={r.id} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
                              <span className="min-w-0">
                                <span className="block text-ink">
                                  {r.product_id ? productNames[r.product_id] || "Item" : r.color || "Item"}
                                </span>
                                {r.product_id && r.color && (
                                  <span className="block text-xs text-ink/50">{r.color}</span>
                                )}
                              </span>
                              <span className="shrink-0 font-medium text-ink">{formatNaira(r.amount)}</span>
                            </li>
                          ))}
                        </ul>
                        {g.buyer_address && (
                          <p className="mt-2 text-sm text-ink/70">
                            <span className="font-medium text-ink">
                              {g.buyer_address === "Pickup in person" ? "Collection: " : "Deliver to: "}
                            </span>
                            {g.buyer_address}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
