"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FlaskConical, Loader2, Plus, Minus, Trash2, Check, ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira, cn } from "@/lib/utils";
import { createDemoSite, createTestProduct, createTestOrder, clearTestData } from "@/app/dashboard/(panel)/sandbox/actions";
import type { DataMode } from "@/lib/sandbox";
import type { Product, Site } from "@/lib/database.types";

const TEST_BUYER = { name: "Test Customer", email: "test@tomora.local", phone: "0800 000 0000", address: "1 Demo Street, Lagos" };

/**
 * The sandbox console: build a demo store, stock it, then walk a purchase all
 * the way through as a customer would, choosing how the payment ends.
 *
 * Nothing here reaches Paystack or emails anyone. Orders it writes carry the
 * test flag, so they show up in the ordinary Orders screen and revenue charts
 * whenever the admin is in test mode, and are invisible everywhere else.
 */
export function SandboxConsole({
  mode, demo, products, templates, stats,
}: {
  mode: DataMode;
  demo: Site | null;
  products: Product[];
  templates: { id: string; name: string; category: string }[];
  stats: { orders: number; revenue: number };
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

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <FlaskConical className="h-6 w-6 text-amber-500" /> Sandbox
        </h1>
        <p className="mt-1 max-w-2xl text-ink/60">
          Rehearse a whole sale, from cart to fulfilment to revenue, without a payment processor or a
          real customer. Switch to <span className="font-semibold">Test</span> mode to see the orders
          you create here in your Orders and Milestones screens.
        </p>
      </div>

      {mode === "real" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You are in <strong>Real</strong> mode. Test orders will be created, but you will not see them
          until you switch to Test mode using the toggle above.
        </div>
      )}

      {/* ---------------------------- demo store ---------------------------- */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-4 w-4" /> Demo store</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {demo ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-cream px-4 py-3 text-sm">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-ink">Tomora Demo</span>
              <span className="text-ink/50">{demo.template_id}</span>
              <span className="ml-auto text-xs text-ink/50">Never published</span>
            </div>
          ) : (
            <p className="text-sm text-ink/60">
              Create a demo store to hold your test products and orders. It is never published and never
              reachable from the web.
            </p>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1">
              <Label>Template</Label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-ink/40"
              >
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
              </select>
            </div>
            <Button onClick={() => run(() => createDemoSite(templateId), demo ? "Demo store switched." : "Demo store created.")} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {demo ? "Change template" : "Create demo store"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {demo && (
        <>
          {/* -------------------------- test products ------------------------ */}
          <Card>
            <CardHeader><CardTitle>Test products</CardTitle></CardHeader>
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
                    () => createTestProduct({ siteId: demo.id, name: newProduct.name, price: newProduct.price }),
                    "Test product added."
                  )}>
                  <Plus className="h-4 w-4" /> Add product
                </Button>
              </div>

              {products.length === 0 ? (
                <p className="rounded-lg border border-dashed border-ink/15 px-4 py-8 text-center text-sm text-ink/50">
                  No products in the demo store yet.
                </p>
              ) : (
                <div className="divide-y divide-ink/5 rounded-lg border border-ink/10">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink/50">
                          {formatNaira(p.price)}
                          {(p as { is_test_only?: boolean }).is_test_only ? " · demo only" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-cream p-1">
                        <button onClick={() => step(p.id, -1)} aria-label={`Fewer ${p.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink disabled:opacity-40"
                          disabled={!cart[p.id]}><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-6 text-center text-sm font-bold tabular-nums">{cart[p.id] || 0}</span>
                        <button onClick={() => step(p.id, 1)} aria-label={`More ${p.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* --------------------------- checkout ---------------------------- */}
          <Card>
            <CardHeader><CardTitle>Simulate a purchase</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Customer name</Label>
                  <Input className="mt-1" value={buyer.name} onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))} /></div>
                <div><Label>Email</Label>
                  <Input className="mt-1" value={buyer.email} onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))} /></div>
                <div><Label>Phone</Label>
                  <Input className="mt-1" value={buyer.phone} onChange={(e) => setBuyer((b) => ({ ...b, phone: e.target.value }))} /></div>
                <div><Label>Delivery address</Label>
                  <Input className="mt-1" value={buyer.address} onChange={(e) => setBuyer((b) => ({ ...b, address: e.target.value }))} /></div>
              </div>

              <div>
                <Label>Payment result to rehearse</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([
                    ["paid", "Paid"],
                    ["pending", "Awaiting payment"],
                    ["failed", "Payment failed"],
                  ] as const).map(([value, text]) => (
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
                  No card is taken and no gateway is called. Only a paid result credits the sandbox wallet.
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
                    siteId: demo.id, buyer,
                    items: inCart.map(([productId, qty]) => ({ productId, qty })),
                    outcome,
                  }),
                  "Test order created. Switch to Test mode to see it in Orders."
                )}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create test order
              </Button>
            </CardContent>
          </Card>

          {/* ------------------------- sandbox totals ------------------------ */}
          <Card>
            <CardHeader><CardTitle>Sandbox totals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Sandbox orders</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{stats.orders}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Sandbox revenue</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{formatNaira(stats.revenue)}</p>
                </div>
              </div>
              <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-medium text-ink/70 hover:text-ink">
                Open Orders <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* ---------------------------- cleanup ---------------------------- */}
          <Card className="border-destructive/30">
            <CardHeader><CardTitle>Clear sandbox data</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-ink/60">
                Deletes every test order, wallet credit and ledger row you have created. Real data is
                untouched.
              </p>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete all sandbox orders and their wallet rows? Real data is not affected.")) return;
                  run(() => clearTestData(), "Sandbox data cleared.");
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete all test data
              </Button>
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
