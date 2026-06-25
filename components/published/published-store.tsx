"use client";

import { useCallback, useMemo, useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Loader2, CheckCircle2, X, Star } from "lucide-react";
import { SiteRenderer } from "@/components/templates";
import type { StoreApi } from "@/components/templates/store-context";
import type { Product, Review, SiteData } from "@/lib/database.types";
import { formatNaira, contrastText } from "@/lib/utils";

interface Line { product: Product; qty: number; color?: string; }

declare global {
  interface Window { PaystackPop?: any; }
}

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack."));
    document.body.appendChild(s);
  });
}

export function PublishedStore({
  templateId, siteData, brandColor, products, reviews = [], siteId, paystackPublicKey, paystackSubaccount,
}: {
  templateId: string;
  siteData: SiteData;
  brandColor: string;
  products: Product[];
  reviews?: Review[];
  siteId: string;
  paystackPublicKey: string | null;
  paystackSubaccount?: string | null;
}) {
  // Payments settle to the owner's Paystack subaccount. The transaction is
  // initialized server-side (platform secret key) and resumed in the popup.
  const canCheckout = !!paystackSubaccount;
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "", address: "" });
  const [colorPick, setColorPick] = useState<{ product: Product; mode: "cart" | "buy" } | null>(null);

  const onBrand = contrastText(brandColor);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.product.price * l.qty, 0);

  const realAdd = useCallback((product: Product, color?: string) => {
    setLines((prev) => {
      const same = (l: Line) => l.product.id === product.id && l.color === color;
      if (prev.some(same)) return prev.map((l) => same(l) ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { product, qty: 1, color }];
    });
    setOpen(true);
  }, []);

  const realBuy = useCallback((product: Product, color?: string) => {
    setLines([{ product, qty: 1, color }]);
    setOpen(true);
    setCheckout(true);
  }, []);

  const addToCart = useCallback((product: Product) => {
    if (product.colors?.length) { setColorPick({ product, mode: "cart" }); return; }
    realAdd(product);
  }, [realAdd]);

  const buyNow = useCallback((product: Product) => {
    if (product.colors?.length) { setColorPick({ product, mode: "buy" }); return; }
    realBuy(product);
  }, [realBuy]);

  function chooseColor(color: string) {
    if (!colorPick) return;
    if (colorPick.mode === "cart") realAdd(colorPick.product, color);
    else realBuy(colorPick.product, color);
    setColorPick(null);
  }

  const setQty = (id: string, color: string | undefined, delta: number) =>
    setLines((prev) => prev.flatMap((l) => {
      if (!(l.product.id === id && l.color === color)) return [l];
      const qty = l.qty + delta;
      return qty <= 0 ? [] : [{ ...l, qty }];
    }));

  const storeApi: StoreApi = useMemo(() => ({ live: true, addToCart, buyNow }), [addToCart, buyNow]);

  async function pay() {
    setError(null);
    if (!canCheckout) { setError("This store is not accepting payments yet."); return; }
    if (!buyer.name || !buyer.email) { setError("Please enter your name and email."); return; }
    setBusy(true);
    try {
      // 1. Create pending order(s) and initialize the transaction server-side
      // (amount validated against DB; settles to the owner's subaccount).
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          buyer,
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty, color: l.color || null })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      if (!data.accessCode) throw new Error("Could not start this transaction.");

      // 2. Resume the server-initialized transaction in the popup.
      await loadPaystack();
      const popup = new window.PaystackPop();
      popup.resumeTransaction(data.accessCode, {
        onSuccess: (txn: { reference: string }) => {
          fetch("/api/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: txn.reference || data.reference }),
          }).finally(() => { setBusy(false); setDone(true); });
        },
        onCancel: () => setBusy(false),
        onError: (err: { message?: string }) => {
          setBusy(false);
          setError(err?.message || "Payment failed. Please try again.");
        },
      });
    } catch (e: any) {
      setBusy(false);
      setError(e.message || "Checkout failed.");
    }
  }

  return (
    <div className="relative">
      <SiteRenderer templateId={templateId} siteData={siteData} brandColor={brandColor} products={products} storeApi={storeApi} siteId={siteId} />

      <ReviewsSection siteId={siteId} brandColor={brandColor} onBrand={onBrand} reviews={reviews} />

      {/* Floating cart button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-xl"
        style={{ background: brandColor, color: onBrand }}
        aria-label="Open cart"
      >
        <ShoppingCart className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-ink">{count}</span>
        )}
      </button>

      {/* Colour selection (products with variants) */}
      {colorPick && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setColorPick(null)}>
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Choose a colour</p>
              <button onClick={() => setColorPick(null)} aria-label="Close" className="text-ink/40 hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 text-sm text-ink/60">{colorPick.product.name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(colorPick.product.colors || []).map((c) => (
                <button key={c} onClick={() => chooseColor(c)}
                  className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-ink"
                  style={{ ["--tw-ring-color" as any]: brandColor }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart / checkout drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setCheckout(false); setDone(false); }} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-semibold text-ink">{done ? "Order confirmed" : checkout ? "Checkout" : "Your Cart"}</h2>
              <button onClick={() => { setOpen(false); setCheckout(false); setDone(false); }}><X className="h-5 w-5 text-ink/50" /></button>
            </div>

            {done ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                <p className="text-lg font-semibold text-ink">Thank you, {buyer.name || "friend"}!</p>
                <p className="text-sm text-ink/60">Your payment was received. A confirmation has been sent to {buyer.email}.</p>
              </div>
            ) : lines.length === 0 ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-ink/50">Your cart is empty.</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  {!checkout ? (
                    <ul className="space-y-4">
                      {lines.map((l) => (
                        <li key={`${l.product.id}-${l.color || ""}`} className="flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                            {l.product.images?.[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={l.product.images[0]} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ink">{l.product.name}</p>
                            {l.color && <p className="text-xs text-ink/50">Colour: {l.color}</p>}
                            <p className="text-sm text-ink/50">{formatNaira(l.product.price)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setQty(l.product.id, l.color, -1)} className="rounded border p-1"><Minus className="h-3 w-3" /></button>
                            <span className="w-5 text-center text-sm">{l.qty}</span>
                            <button onClick={() => setQty(l.product.id, l.color, 1)} className="rounded border p-1"><Plus className="h-3 w-3" /></button>
                            <button onClick={() => setQty(l.product.id, l.color, -l.qty)} className="ml-1 text-ink/40"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-3">
                      {(["name", "email", "phone", "address"] as const).map((f) => (
                        <input key={f}
                          className="w-full rounded-md border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink"
                          placeholder={{ name: "Full name", email: "Email", phone: "Phone", address: "Delivery address" }[f]}
                          value={buyer[f]}
                          onChange={(e) => setBuyer((b) => ({ ...b, [f]: e.target.value }))}
                        />
                      ))}
                      {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                  )}
                </div>

                <div className="border-t p-5">
                  <div className="mb-4 flex justify-between text-sm">
                    <span className="text-ink/60">Total</span>
                    <span className="font-semibold text-ink">{formatNaira(total)}</span>
                  </div>
                  {!checkout ? (
                    <button onClick={() => setCheckout(true)} className="w-full rounded-md py-3 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>
                      Proceed to Checkout
                    </button>
                  ) : (
                    <button onClick={pay} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold disabled:opacity-60" style={{ background: brandColor, color: onBrand }}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay {formatNaira(total)}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stars({ value, onChange, size = "h-5 w-5" }: { value: number; onChange?: (n: number) => void; size?: string }) {
  return (
    <span className="inline-flex" style={{ color: "var(--review-accent, #d4a23a)" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star`}
        >
          <Star className={size} fill={n <= Math.round(value) ? "currentColor" : "none"} />
        </button>
      ))}
    </span>
  );
}

function ReviewsSection({
  siteId, brandColor, onBrand, reviews,
}: {
  siteId: string;
  brandColor: string;
  onBrand: string;
  reviews: Review[];
}) {
  const [list, setList] = useState<Review[]>(reviews);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  async function submit() {
    setError(null);
    if (!name.trim()) { setError("Please enter your name."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, name, email, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit review.");
      setList([{ id: `tmp-${Date.now()}`, site_id: siteId, product_id: null, reviewer_name: name, reviewer_email: email || null, rating, comment: comment || null, is_published: true, created_at: new Date().toISOString() }, ...list]);
      setDone(true); setName(""); setEmail(""); setComment(""); setRating(5);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white" style={{ ["--review-accent" as any]: brandColor }}>
      <div className="mx-auto max-w-5xl px-5 py-16">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold text-neutral-900">Customer Reviews</h2>
          {list.length > 0 ? (
            <div className="mt-2 flex items-center gap-2 text-neutral-600">
              <Stars value={avg} /> <span className="font-semibold text-neutral-900">{avg.toFixed(1)}</span>
              <span>· {list.length} review{list.length > 1 ? "s" : ""}</span>
            </div>
          ) : (
            <p className="mt-2 text-neutral-500">Be the first to leave a review.</p>
          )}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {list.length === 0 && <p className="text-sm text-neutral-500">No reviews yet.</p>}
            {list.map((r) => (
              <div key={r.id} className="rounded-2xl border border-black/10 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">{r.reviewer_name}</span>
                  <Stars value={r.rating} size="h-4 w-4" />
                </div>
                {r.comment && <p className="mt-2 text-sm text-neutral-600">{r.comment}</p>}
                <p className="mt-2 text-xs text-neutral-400">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-black/10 p-5">
            <h3 className="font-semibold text-neutral-900">Leave a review</h3>
            {done ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Thanks for your review!
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2"><span className="text-sm text-neutral-600">Your rating</span><Stars value={rating} onChange={setRating} /></div>
                <input className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                <input className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
                <textarea rows={3} className="w-full rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Share your experience" value={comment} onChange={(e) => setComment(e.target.value)} />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={submit} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit Review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
