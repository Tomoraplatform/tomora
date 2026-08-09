"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, CheckCircle2, X, Star } from "lucide-react";
import { SiteRenderer } from "@/components/templates";
import type { StoreApi } from "@/components/templates/store-context";
import type { Product, Review, SiteData } from "@/lib/database.types";
import { formatNaira, contrastText } from "@/lib/utils";
import { CartDrawer } from "./cart-drawer";
import { useStoreCart } from "./store/use-store-cart";
import { ownsMobileBar } from "@/lib/templates/mobile-bar";

export function PublishedStore({
  templateId, siteData, brandColor, products, reviews = [], siteId, bankName, accountNumber, accountName, paystackEnabled = false, isTenantHost = false,
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
  /** True only on the real published tenant host, where /category and /product routes resolve. */
  isTenantHost?: boolean;
}) {
  const router = useRouter();
  const { lines, add: cartAdd, setQty, count } = useStoreCart(siteId, products);
  const [open, setOpen] = useState(false);
  const [buyNowIntent, setBuyNowIntent] = useState(false);
  // Product detail view fallback for non-tenant contexts (editor/dashboard preview),
  // where /product/[id] doesn't resolve: description + colour variants inline.
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailColor, setDetailColor] = useState<string | null>(null);

  const onBrand = contrastText(brandColor);

  const realAdd = useCallback((product: Product, color?: string, qty = 1) => {
    cartAdd(product, color, qty);
    setBuyNowIntent(false);
    setOpen(true);
  }, [cartAdd]);

  const realBuy = useCallback((product: Product, color?: string) => {
    cartAdd(product, color);
    setBuyNowIntent(true);
    setOpen(true);
  }, [cartAdd]);

  const productColorNames = (p: Product): string[] =>
    (p.color_variants?.length ? p.color_variants.map((v) => v.name) : (p.colors || [])).filter(Boolean);

  const openProduct = useCallback((product: Product) => {
    if (isTenantHost) { router.push(`/product/${product.id}`); return; }
    setDetail(product);
    setDetailColor(productColorNames(product)[0] ?? null);
  }, [isTenantHost, router]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    // On the real site, colour/description detail lives on the product's own
    // page, a card's "Add to Cart" just adds the default variant directly.
    // A card that already asked for a quantity has made the choice, so it adds
    // straight away rather than sending the customer to the detail view.
    if (qty === 1 && !isTenantHost && (productColorNames(product).length || product.description)) { openProduct(product); return; }
    realAdd(product, isTenantHost ? productColorNames(product)[0] : undefined, qty);
  }, [realAdd, openProduct, isTenantHost]);

  const buyNow = useCallback((product: Product) => {
    if (!isTenantHost && (productColorNames(product).length || product.description)) { openProduct(product); return; }
    realBuy(product, isTenantHost ? productColorNames(product)[0] : undefined);
  }, [realBuy, openProduct, isTenantHost]);

  const storeApi: StoreApi = useMemo(
    () => ({ live: true, addToCart, buyNow, openProduct, openCart: () => setOpen(true), tenantHost: isTenantHost }),
    [addToCart, buyNow, openProduct, isTenantHost]
  );

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

      {/* Floating cart button. Templates with their own bottom bar carry a cart
          in it, so on phones this would only sit on top of one of their tabs. */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 h-14 w-14 items-center justify-center rounded-full shadow-xl ${
          ownsMobileBar(templateId) ? "hidden lg:flex" : "flex"
        }`}
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
