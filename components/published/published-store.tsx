"use client";

import { useCallback, useMemo, useState } from "react";
import { ShoppingCart, Loader2, CheckCircle2, X, Star } from "lucide-react";
import { SiteRenderer } from "@/components/templates";
import type { StoreApi } from "@/components/templates/store-context";
import type { Product, Review, SiteData } from "@/lib/database.types";
import { formatNaira, contrastText } from "@/lib/utils";
import { CartDrawer, type CartLine } from "./cart-drawer";

type Line = CartLine;

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
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [buyNowIntent, setBuyNowIntent] = useState(false);
  // Product detail view (description + colour variants that swap the image).
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailColor, setDetailColor] = useState<string | null>(null);

  const onBrand = contrastText(brandColor);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  const realAdd = useCallback((product: Product, color?: string) => {
    setLines((prev) => {
      const same = (l: Line) => l.product.id === product.id && l.color === color;
      if (prev.some(same)) return prev.map((l) => same(l) ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { product, qty: 1, color }];
    });
    setBuyNowIntent(false);
    setOpen(true);
  }, []);

  const realBuy = useCallback((product: Product, color?: string) => {
    setLines([{ product, qty: 1, color }]);
    setBuyNowIntent(true);
    setOpen(true);
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

      <CartDrawer
        open={open} onClose={() => setOpen(false)} lines={lines} setQty={setQty}
        siteData={siteData} brandColor={brandColor} siteId={siteId}
        bankName={bankName} accountNumber={accountNumber} accountName={accountName} paystackEnabled={paystackEnabled}
        startAtCheckout={buyNowIntent}
      />
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
      setList([{ id: `tmp-${Date.now()}`, site_id: siteId, product_id: null, reviewer_name: name, reviewer_email: email || null, rating, comment: comment || null, is_published: true, verified_purchase: !!data.verified, created_at: new Date().toISOString() }, ...list]);
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
