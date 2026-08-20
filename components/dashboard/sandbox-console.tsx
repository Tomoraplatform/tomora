"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FlaskConical, Loader2, Plus, Minus, Trash2, Check, Store, Pencil, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira, cn } from "@/lib/utils";
import {
  createDemoSite, createTestProduct, createTestOrder, clearTestData, selectDemoSite, deleteDemoSite, setDemoLive,
} from "@/app/dashboard/(panel)/sandbox/actions";
import type { DataMode } from "@/lib/sandbox";
import type { Product } from "@/lib/database.types";
import { RevenueAnalytics, type AnalyticsData } from "./revenue-analytics";

export interface SandboxOrder {
  reference: string;
  createdAt: string;
  status: string;
  buyer: string;
  total: number;
  items: { name: string; qty: number; amount: number }[];
}

const TEST_BUYER = { name: "Test Customer", email: "test@tomora.local", phone: "0800 000 0000", address: "1 Demo Street, Lagos" };
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * The sandbox: as many demo stores as the team wants, one per template, each
 * with its own products and its own test orders.
 *
 * Switching to Test mode points the whole dashboard at the demo store chosen
 * here, so the editor, Products, Orders and Milestones screens are the
 * sandbox's rather than the real business's.
 */
export function SandboxConsole({
  mode, sites, activeId, products, orders, templates, analytics,
}: {
  mode: DataMode;
  sites: { id: string; name: string; templateId: string; isLive: boolean; url: string }[];
  activeId: string | null;
  products: Product[];
  orders: SandboxOrder[];
  templates: { id: string; name: string; category: string }[];
  analytics: AnalyticsData | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState(templates[0]?.id || "shop-01");
  const [newProduct, setNewProduct] = useState({ name: "", price: 5000 });
  const [cart, setCart] = useState<Record<string, number>>({});
  const [buyer, setBuyer] = useState(TEST_BUYER);
  const [outcome, setOutcome] = useState<"paid" | "pending" | "failed">("paid");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => {
    setError(null); setNote(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) { setError(res.error || "Something went wrong."); return; }
      setNote(ok);
      router.refresh();
    });
  };

  const inCart = Object.entries(cart).filter(([, q]) => q > 0);
  const cartTotal = inCart.reduce((sum, [id, q]) => sum + (products.find((p) => p.id === id)?.price || 0) * q, 0);
  const step = (id: string, d: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(99, (c[id] || 0) + d)) }));

  const active = sites.find((s) => s.id === activeId) || null;

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status !== "pending");
    return {
      orders: orders.length,
      paidOrders: paid.length,
      revenue: paid.reduce((s, o) => s + o.total, 0),
      units: paid.reduce((s, o) => s + o.items.reduce((n, i) => n + i.qty, 0), 0),
    };
  }, [orders]);

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <FlaskConical className="h-6 w-6 text-amber-500" /> Sandbox
        </h1>
        <p className="mt-1 max-w-2xl text-ink/60">
          Build demo stores, stock them, and run orders through them. While Test mode is on, the whole
          dashboard works on the demo store selected here, so the editor, Products, Orders and
          Milestones are all the sandbox&apos;s.
        </p>
      </div>

      {mode === "real" && sites.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You are in <strong>Real</strong> mode, looking at your real business. Switch the toggle to{" "}
          <strong>Test</strong> to work on the demo store.
        </div>
      )}

      {/* ---------------------------- demo stores --------------------------- */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-4 w-4" /> Demo stores</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {sites.length === 0 ? (
            <p className="text-sm text-ink/60">
              No demo store yet. Pick a template below and create one. It is never published and never
              reachable from the web.
            </p>
          ) : (
            <div className="space-y-2">
              {sites.map((s) => (
                <div key={s.id} className={cn(
                  "flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3",
                  s.id === activeId ? "border-amber-400 bg-amber-50" : "border-ink/10"
                )}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
                    <p className="text-xs text-ink/50">{s.templateId}</p>
                  </div>
                  {s.id === activeId ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                      <Check className="h-3.5 w-3.5" /> In use
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" disabled={pending}
                      onClick={() => run(() => selectDemoSite(s.id), "Now working on this demo store.")}>
                      Use this store
                    </Button>
                  )}
                  <button
                    type="button"
                    aria-label={`Delete ${s.name}`}
                    className="text-ink/40 transition hover:text-destructive"
                    onClick={() => {
                      if (!confirm(`Delete ${s.name} and everything in it?`)) return;
                      run(() => deleteDemoSite(s.id), "Demo store deleted.");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3 border-t border-ink/10 pt-4">
            <div className="min-w-[240px] flex-1">
              <Label>Add another demo store</Label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink/40"
              >
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
              </select>
            </div>
            <Button onClick={() => run(() => createDemoSite(templateId), "Demo store created.")} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create demo store
            </Button>
          </div>

          {active && mode === "test" && (
            <div className="space-y-3 border-t border-ink/10 pt-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/editor"><Pencil className="h-4 w-4" /> Edit this template</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/products">Manage its products</Link>
                </Button>
                <Button
                  size="sm"
                  variant={active.isLive ? "outline" : "default"}
                  disabled={pending}
                  onClick={() => run(
                    () => setDemoLive(active.id, !active.isLive),
                    active.isLive ? "Demo store taken offline." : "Demo store published."
                  )}
                >
                  {active.isLive ? "Take offline" : "Publish demo store"}
                </Button>
              </div>
              {active.isLive && (
                <div className="rounded-lg bg-cream px-4 py-3 text-sm">
                  <p className="text-ink/60">
                    Shop it like a customer. Anything bought there is a paid test order: no card is
                    taken, nobody is emailed, and it lands in Orders and the stats below.
                  </p>
                  <a href={active.url} target="_blank" rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 font-medium text-ink underline">
                    <Eye className="h-3.5 w-3.5" /> {active.url.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {activeId && (
        <>
          {/* ------------------------- quick products ----------------------- */}
          <Card>
            <CardHeader><CardTitle>Products in this demo store</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <Label>Name</Label>
                  <Input className="mt-1" value={newProduct.name} placeholder="Demo Hoodie"
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="w-32">
                  <Label>Price (NGN)</Label>
                  <Input className="mt-1" type="number" min={0} value={newProduct.price}
                    onChange={(e) => setNewProduct((p) => ({ ...p, price: Number(e.target.value) }))} />
                </div>
                <Button variant="outline" disabled={pending || !newProduct.name.trim()}
                  onClick={() => run(
                    () => createTestProduct({ siteId: activeId, name: newProduct.name, price: newProduct.price }),
                    "Product added."
                  )}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <p className="text-xs text-ink/50">
                For photos, sizes and variants, use{" "}
                <Link href="/dashboard/products" className="underline">Products</Link> while in Test mode.
              </p>
            </CardContent>
          </Card>

          {/* --------------------------- order builder ---------------------- */}
          <Card>
            <CardHeader><CardTitle>Create a test order</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {products.length === 0 ? (
                <p className="rounded-lg border border-dashed border-ink/15 px-4 py-8 text-center text-sm text-ink/50">
                  Add a product first.
                </p>
              ) : (
                <div className="divide-y divide-ink/5 rounded-lg border border-ink/10">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink/50">{formatNaira(p.price)}</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-cream p-1">
                        <button onClick={() => step(p.id, -1)} aria-label={`Fewer ${p.name}`} disabled={!cart[p.id]}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink disabled:opacity-40">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold tabular-nums">{cart[p.id] || 0}</span>
                        <button onClick={() => step(p.id, 1)} aria-label={`More ${p.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Customer name</Label>
                  <Input className="mt-1" value={buyer.name} onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))} /></div>
                <div><Label>Email</Label>
                  <Input className="mt-1" value={buyer.email} onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))} /></div>
              </div>

              <div>
                <Label>Mark this order as</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([["paid", "Paid"], ["pending", "Awaiting payment"], ["failed", "Payment failed"]] as const).map(([value, text]) => (
                    <button key={value} type="button" onClick={() => setOutcome(value)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition",
                        outcome === value ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink/70 hover:border-ink/40"
                      )}>
                      {text}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink/50">
                  No card is taken and no gateway is called. Only a paid order counts towards sandbox revenue.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-cream px-4 py-3">
                <span className="text-sm text-ink/70">
                  {inCart.length ? `${inCart.reduce((n, [, q]) => n + q, 0)} item(s)` : "Nothing selected"}
                </span>
                <span className="text-lg font-bold text-ink">{formatNaira(cartTotal)}</span>
              </div>

              <Button
                disabled={pending || !inCart.length}
                onClick={() => run(
                  () => createTestOrder({
                    siteId: activeId, buyer,
                    items: inCart.map(([productId, qty]) => ({ productId, qty })),
                    outcome,
                  }),
                  "Test order created."
                )}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create test order
              </Button>
            </CardContent>
          </Card>

          {analytics && <RevenueAnalytics data={analytics} isTest />}

          {/* ----------------------------- stats ---------------------------- */}
          <Card>
            <CardHeader><CardTitle>Sandbox orders</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["Sandbox revenue", formatNaira(stats.revenue)],
                  ["Paid orders", String(stats.paidOrders)],
                  ["All orders", String(stats.orders)],
                  ["Units sold", String(stats.units)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{label}</p>
                    <p className="mt-1 text-xl font-bold text-ink">{value}</p>
                  </div>
                ))}
              </div>

              {orders.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-ink/10">
                  <table className="w-full text-sm">
                    <thead className="border-b border-ink/10 bg-cream/60 text-left text-ink/60">
                      <tr>
                        <th className="p-3 font-medium">Date</th>
                        <th className="p-3 font-medium">Items</th>
                        <th className="p-3 font-medium">Qty</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {orders.map((o) => (
                        <tr key={o.reference}>
                          <td className="whitespace-nowrap p-3 text-ink/70">{fmtDate(o.createdAt)}</td>
                          <td className="p-3 text-ink/80">{o.items.map((i) => i.name).join(", ")}</td>
                          <td className="p-3 tabular-nums text-ink/80">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                          <td className="p-3">
                            <span className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-medium",
                              o.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            )}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-semibold text-ink">{formatNaira(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
                <Button
                  variant="outline"
                  disabled={pending || orders.length === 0}
                  onClick={() => {
                    if (!confirm("Reset this demo store's orders and revenue? Real data is not affected.")) return;
                    run(() => clearTestData(activeId), "Sandbox stats reset.");
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> Reset stats
                </Button>
                <span className="text-xs text-ink/50">Clears the orders and revenue of this demo store only.</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {note && (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" /> {note}
        </p>
      )}
    </div>
  );
}
