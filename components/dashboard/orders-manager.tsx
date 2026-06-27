"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatNaira, cn } from "@/lib/utils";
import { updateOrderStatus } from "@/app/dashboard/store-actions";
import type { Order, OrderStatus } from "@/lib/database.types";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered"];
type Filter = "all" | OrderStatus;

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting transfer",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
};
const STATUS_PILL: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-700",
  shipped: "bg-sky-100 text-sky-700",
  delivered: "bg-ink/10 text-ink/70",
};

export function OrdersManager({ initial, productNames }: { initial: Order[]; productNames: Record<string, string> }) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");

  async function change(id: string, status: OrderStatus) {
    setOrders((os) => os.map((o) => o.id === id ? { ...o, status } : o));
    await updateOrderStatus(id, status);
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length, pending: 0, paid: 0, shipped: 0, delivered: 0 };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Awaiting transfer" },
    { key: "paid", label: "Paid" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <p className="mt-1 text-ink/60">Customers pay by bank transfer — mark an order <span className="font-medium">Paid</span> once the money lands in your account.</p>
      </div>

      {counts.pending > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You have <span className="font-semibold">{counts.pending}</span> order{counts.pending > 1 ? "s" : ""} awaiting payment confirmation.
        </div>
      )}

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
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Buyer</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {visible.map((o) => (
                <tr key={o.id} className={o.status === "pending" ? "bg-amber-50/40" : undefined}>
                  <td className="p-4 font-mono text-xs text-ink/60">{o.id.slice(0, 8)}</td>
                  <td className="p-4 text-ink/80">
                    {o.product_id ? productNames[o.product_id] || "—" : "—"}
                    {o.color && <div className="text-xs text-ink/50">Colour: {o.color}</div>}
                  </td>
                  <td className="p-4">
                    <div className="text-ink">{o.buyer_name}</div>
                    <div className="text-xs text-ink/50">{o.buyer_email}</div>
                    {o.buyer_phone && <div className="text-xs text-ink/50">{o.buyer_phone}</div>}
                  </td>
                  <td className="p-4 font-medium text-ink">{formatNaira(o.amount)}</td>
                  <td className="p-4 text-ink/60">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex flex-col items-start gap-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_PILL[o.status])}>{STATUS_LABEL[o.status]}</span>
                      {o.status === "pending" ? (
                        <Button size="sm" className="h-7" onClick={() => change(o.id, "paid")}>
                          <Check className="h-3.5 w-3.5" /> Mark paid
                        </Button>
                      ) : (
                        <Select value={o.status} onValueChange={(v) => change(o.id, v as OrderStatus)}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}><span className="capitalize">{s === "pending" ? "Awaiting transfer" : s}</span></SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
