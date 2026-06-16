"use client";

import { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatNaira } from "@/lib/utils";
import { updateOrderStatus } from "@/app/dashboard/store-actions";
import type { Order, OrderStatus } from "@/lib/database.types";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered"];

export function OrdersManager({ initial, productNames }: { initial: Order[]; productNames: Record<string, string> }) {
  const [orders, setOrders] = useState<Order[]>(initial);

  async function change(id: string, status: OrderStatus) {
    setOrders((os) => os.map((o) => o.id === id ? { ...o, status } : o));
    await updateOrderStatus(id, status);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <p className="mt-1 text-ink/60">Track and fulfil your store orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 p-12 text-center text-ink/50">No orders yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full min-w-[640px] text-sm">
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
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="p-4 font-mono text-xs text-ink/60">{o.id.slice(0, 8)}</td>
                  <td className="p-4 text-ink/80">{o.product_id ? productNames[o.product_id] || "—" : "—"}</td>
                  <td className="p-4">
                    <div className="text-ink">{o.buyer_name}</div>
                    <div className="text-xs text-ink/50">{o.buyer_email}</div>
                  </td>
                  <td className="p-4 font-medium text-ink">{formatNaira(o.amount)}</td>
                  <td className="p-4 text-ink/60">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <Select value={o.status} onValueChange={(v) => change(o.id, v as OrderStatus)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="capitalize">{s}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
