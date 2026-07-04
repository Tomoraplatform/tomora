"use client";

import { useCallback, useMemo, useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Loader2, CheckCircle2, X, Star, Copy } from "lucide-react";
import { SiteRenderer } from "@/components/templates";
import type { StoreApi } from "@/components/templates/store-context";
import type { Product, Review, SiteData } from "@/lib/database.types";
import { formatNaira, contrastText } from "@/lib/utils";
import { validateCoupon } from "@/lib/coupons";
import { PAYSTACK_FEE_PERCENT } from "@/lib/constants";

interface Line { product: Product; qty: number; color?: string; }

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack."));
    document.body.appendChild(s);
  });
}

export function PublishedStore({
  templateId, siteData, brandColor, products, reviews = [], siteId, bankName, accountNumber, accountName, paystackEnabled = false,
}: {
  templateId: string;
  siteData: SiteData;
  brandColor: string;
  products: Product[];
  reviews?: Review[];
  siteId: string;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  paystackEnabled?: boolean;
}) {
  // Enabled payment methods. Bank transfer needs a connected account; Paystack
  // needs a subaccount (both gated by the owner's saved payment settings).
  const methods = siteData.paymentMethods;
  const transferEnabled = !!accountNumber && (methods?.transfer ?? true);
  const canPaystack = paystackEnabled && (methods?.paystack ?? true);
  const canCheckout = transferEnabled || canPaystack;
  const feeBearer = siteData.feeBearer === "customer" ? "customer" : "owner";
  const [payMethod, setPayMethod] = useState<"paystack" | "transfer">(canPaystack ? "paystack" : "transfer");
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "", address: "" });
  // Product detail view (description + colour variants that swap the image).
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailColor, setDetailColor] = useState<string | null>(null);

  // Discount code / coupon.
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Shipping location + fee.
  const zones = siteData.shippingZones || [];
  const [shippingZoneId, setShippingZoneId] = useState<string>("");
  const shippingFee = zones.find((z) => z.id === shippingZoneId)?.fee || 0;

  const onBrand = contrastText(brandColor);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.product.price * l.qty, 0);
  const discount = appliedCoupon ? validateCoupon(siteData.coupons, appliedCoupon, subtotal).discount : 0;
  const total = Math.max(0, subtotal - discount) + shippingFee;

  function applyCoupon() {
    setCouponError(null);
    const res = validateCoupon(siteData.coupons, couponInput, subtotal);
    if (res.error || !res.coupon) { setAppliedCoupon(null); setCouponError(res.error || "That code isn't valid."); return; }
    setAppliedCoupon(res.coupon.code);
  }

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

  const productColorNames = (p: Product): string[] =>
    (p.color_variants?.length ? p.color_variants.map((v) => v.name) : (p.colors || [])).filter(Boolean);

  const openProduct = useCallback((product: Product) => {
    setDetail(product);
    setDetailColor(productColorNames(product)[0] ?? null);
  }, []);

  const addToCart = useCallback((product: Product) => {
    // Products with colours (or a description) open the detail view first.
    if (productColorNames(product).length || product.description) { openProduct(product); return; }
    realAdd(product);
  }, [realAdd, openProduct]);

  const buyNow = useCallback((product: Product) => {
    if (productColorNames(product).length || product.description) { openProduct(product); return; }
    realBuy(product);
  }, [realBuy, openProduct]);

  const setQty = (id: string, color: string | undefined, delta: number) =>
    setLines((prev) => prev.flatMap((l) => {
      if (!(l.product.id === id && l.color === color)) return [l];
      const qty = l.qty + delta;
      return qty <= 0 ? [] : [{ ...l, qty }];
    }));

  const storeApi: StoreApi = useMemo(() => ({ live: true, addToCart, buyNow, openProduct }), [addToCart, buyNow, openProduct]);

  // Image shown in the detail view: the selected colour's image, else the main image.
  const detailImage = (() => {
    if (!detail) return "";
    const v = detail.color_variants?.find((x) => x.name === detailColor);
    return v?.image || detail.images?.[0] || "";
  })();
  const detailColors = detail ? productColorNames(detail) : [];

  // Places the order. Bank transfer records a pending order + shows bank details;
  // Paystack opens the inline popup and confirms on success.
  async function placeOrder() {
    setError(null);
    if (!canCheckout) { setError("This store hasn't added a payment account yet."); return; }
    if (!buyer.name || !buyer.email) { setError("Please enter your name and email."); return; }
    const activeMethod = canPaystack && transferEnabled ? payMethod : (canPaystack ? "paystack" : "transfer");
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          buyer,
          items: lines.map((l) => ({ productId: l.product.id, qty: l.qty, color: l.color || null })),
          couponCode: appliedCoupon || undefined,
          shippingZoneId: shippingZoneId || undefined,
          method: activeMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order.");

      if (activeMethod === "paystack" && data.accessCode) {
        await loadPaystack();
        const popup = new (window as any).PaystackPop();
        popup.resumeTransaction(data.accessCode, {
          onSuccess: (txn: { reference: string }) => {
            fetch("/api/checkout/confirm", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: txn.reference || data.reference }),
            }).finally(() => { setBusy(false); setDone(true); });
          },
          onCancel: () => setBusy(false),
          onError: (err: { message?: string }) => { setBusy(false); setError(err?.message || "Payment failed."); },
        });
        return;
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Could not place order. Please try again.");
    } finally {
      if (!(canPaystack && payMethod === "paystack")) setBusy(false);
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

      {/* Product detail (description + colour variants that swap the image) */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setDetail(null)}>
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
              <p className="truncate font-semibold text-ink">{detail.name}</p>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-ink/40 hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid flex-1 overflow-y-auto md:grid-cols-2">
              <div className="bg-neutral-100">
                {detailImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detailImage} alt={detail.name} className="h-72 w-full object-cover md:h-full" />
                ) : <div className="h-72 md:h-full" />}
              </div>
              <div className="space-y-4 p-5">
                <p className="text-xl font-bold text-ink">{formatNaira(detail.price)}</p>
                {detail.description && <p className="text-sm leading-relaxed text-ink/70">{detail.description}</p>}

                {detailColors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-ink">Colour: <span className="text-ink/60">{detailColor}</span></p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detailColors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setDetailColor(c)}
                          className="rounded-full border px-4 py-2 text-sm font-medium transition"
                          style={detailColor === c
                            ? { background: brandColor, color: onBrand, borderColor: brandColor }
                            : { borderColor: "rgba(0,0,0,0.15)", color: "#022245" }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { realAdd(detail, detailColor || undefined); setDetail(null); }}
                    className="flex-1 rounded-md px-4 py-3 text-sm font-semibold"
                    style={{ background: brandColor, color: onBrand }}
                  >
                    Add to cart
                  </button>
                  <button
                    onClick={() => { realBuy(detail, detailColor || undefined); setDetail(null); }}
                    className="flex-1 rounded-md border border-ink/20 px-4 py-3 text-sm font-semibold text-ink"
                  >
                    Buy now
                  </button>
                </div>
              </div>
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
                <p className="text-lg font-semibold text-ink">Order received, {buyer.name || "friend"}!</p>
                <p className="text-sm text-ink/60">Please complete your transfer of <span className="font-semibold text-ink">{formatNaira(total)}</span>{accountNumber ? <> to <span className="font-semibold text-ink">{accountNumber}</span>{accountName ? ` (${accountName})` : ""}</> : ""}. Details sent to {buyer.email}.</p>
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">✓ The seller has been notified of your order and will confirm your payment, then process it.</p>
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

                      {/* Delivery location */}
                      {zones.length > 0 && (
                        <select
                          value={shippingZoneId}
                          onChange={(e) => setShippingZoneId(e.target.value)}
                          className="w-full rounded-md border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink"
                        >
                          <option value="">Select delivery location…</option>
                          {zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {z.fee > 0 ? formatNaira(z.fee) : "Free"}</option>)}
                        </select>
                      )}

                      {/* Payment method choice (only when both are enabled) */}
                      {canPaystack && transferEnabled && (
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => setPayMethod("paystack")}
                            className="rounded-lg border px-3 py-2.5 text-sm font-semibold transition"
                            style={payMethod === "paystack" ? { borderColor: brandColor, background: `${brandColor}12`, color: "#022245" } : { borderColor: "rgba(0,0,0,0.15)", color: "#4b5563" }}>
                            Pay online (card)
                          </button>
                          <button type="button" onClick={() => setPayMethod("transfer")}
                            className="rounded-lg border px-3 py-2.5 text-sm font-semibold transition"
                            style={payMethod === "transfer" ? { borderColor: brandColor, background: `${brandColor}12`, color: "#022245" } : { borderColor: "rgba(0,0,0,0.15)", color: "#4b5563" }}>
                            Bank transfer
                          </button>
                        </div>
                      )}

                      {!canCheckout && (
                        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This store hasn&apos;t added a payment account yet.</p>
                      )}

                      {/* Paystack (card / bank / USSD) */}
                      {canCheckout && (canPaystack && (!transferEnabled || payMethod === "paystack")) && (
                        <div className="rounded-lg border border-ink/15 bg-cream/50 p-4 text-sm">
                          <p className="font-semibold text-ink">Pay {formatNaira(total)} securely online</p>
                          <p className="mt-1 text-xs text-ink/55">Card, bank or USSD via Paystack. You&apos;ll get a receipt instantly.</p>
                          {feeBearer === "customer" && (
                            <p className="mt-1 text-xs text-ink/55">A {PAYSTACK_FEE_PERCENT}% payment fee applies at checkout.</p>
                          )}
                        </div>
                      )}

                      {/* Direct bank transfer */}
                      {canCheckout && (transferEnabled && (!canPaystack || payMethod === "transfer")) && (
                        <div className="rounded-lg border border-ink/15 bg-cream/50 p-4">
                          <p className="text-sm font-semibold text-ink">Pay {formatNaira(total)} by bank transfer to:</p>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-base font-bold text-ink">{accountNumber}</span>
                              <button type="button" onClick={() => { navigator.clipboard?.writeText(accountNumber || ""); }} className="flex items-center gap-1 text-xs text-ink/60 hover:text-ink"><Copy className="h-3.5 w-3.5" /> Copy</button>
                            </div>
                            {accountName && <p className="text-ink/80">{accountName}</p>}
                            {bankName && <p className="text-ink/60">{bankName}</p>}
                          </div>
                          <p className="mt-3 text-xs text-ink/55">Make the transfer, then tap the button below. The seller confirms your payment and processes your order.</p>
                        </div>
                      )}

                      {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                  )}
                </div>

                <div className="border-t p-5">
                  {/* Discount code */}
                  {(siteData.coupons?.some((c) => c.active) ?? false) && (
                    <div className="mb-4">
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                          <span>Code <span className="font-semibold">{appliedCoupon}</span> applied</span>
                          <button onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="text-xs font-semibold underline">Remove</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                            placeholder="Discount code"
                            className="flex-1 rounded-md border border-ink/15 px-3 py-2 text-sm uppercase outline-none focus:border-ink"
                          />
                          <button onClick={applyCoupon} className="rounded-md border border-ink/20 px-4 py-2 text-sm font-semibold text-ink">Apply</button>
                        </div>
                      )}
                      {couponError && <p className="mt-1.5 text-xs text-destructive">{couponError}</p>}
                    </div>
                  )}

                  {(discount > 0 || shippingFee > 0) && (
                    <>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-ink/60">Subtotal</span>
                        <span className="text-ink/70">{formatNaira(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="mb-1.5 flex justify-between text-sm text-emerald-700">
                          <span>Discount</span>
                          <span>−{formatNaira(discount)}</span>
                        </div>
                      )}
                      {shippingFee > 0 && (
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="text-ink/60">Shipping</span>
                          <span className="text-ink/70">{formatNaira(shippingFee)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="mb-4 flex justify-between text-sm">
                    <span className="text-ink/60">Total</span>
                    <span className="font-semibold text-ink">{formatNaira(total)}</span>
                  </div>
                  {!checkout ? (
                    <button onClick={() => setCheckout(true)} className="w-full rounded-md py-3 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>
                      Proceed to Checkout
                    </button>
                  ) : (
                    <button onClick={placeOrder} disabled={busy || !canCheckout} className="flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold disabled:opacity-60" style={{ background: brandColor, color: onBrand }}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      {(canPaystack && (!transferEnabled || payMethod === "paystack")) ? `Pay ${formatNaira(feeBearer === "customer" ? Math.round(total * (1 + PAYSTACK_FEE_PERCENT / 100)) : total)} now` : "I've sent the payment"}
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
