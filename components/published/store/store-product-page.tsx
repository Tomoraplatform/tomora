"use client";

import { useState } from "react";
import Link from "next/link";
import { Facebook, Twitter, Link2, Minus, Plus, Loader2, CheckCircle2, Star, ShieldCheck, Ruler, X } from "lucide-react";
import type { Product, Review, Site } from "@/lib/database.types";
import { formatNaira } from "@/lib/utils";
import { StoreChrome, useStoreCartApi } from "./store-chrome";

export function StoreProductPage({
  site, product, categoryProducts, reviews, paystackEnabled,
}: {
  site: Site;
  product: Product;
  /** All active products, for cart hydration context. */
  categoryProducts: Product[];
  reviews: Review[];
  paystackEnabled: boolean;
}) {
  const siteData = site.site_data;
  const brandColor = siteData?.brandColor || "#022245";

  return (
    <StoreChrome
      siteData={siteData} brandColor={brandColor} siteId={site.id} products={categoryProducts}
      bankName={site.bank_name} accountNumber={site.account_number} accountName={site.account_name} paystackEnabled={paystackEnabled}
    >
      <ProductDetail product={product} brandColor={brandColor} />
      <ProductReviews siteId={site.id} productId={product.id} reviews={reviews} brandColor={brandColor} />
    </StoreChrome>
  );
}

function ProductDetail({ product, brandColor }: { product: Product; brandColor: string }) {
  const cart = useStoreCartApi();
  const colorNames = (product.color_variants?.length ? product.color_variants.map((v) => v.name) : (product.colors || [])).filter(Boolean);
  const [color, setColor] = useState<string | undefined>(colorNames[0]);
  const sizes = (product.sizes || []).filter((v) => v.name);
  const [size, setSize] = useState<string | undefined>(sizes[0]?.name);
  const [guideOpen, setGuideOpen] = useState(false);
  const [qty, setQty] = useState(1);
  // The guide belongs to the chosen size, so switching size switches the chart.
  const activeGuide = sizes.find((v) => v.name === size)?.guide;
  /** What the order shows: colour and size together, e.g. "Black · M". */
  const variantLabel = [color, size].filter(Boolean).join(" · ") || undefined;
  const [thumb, setThumb] = useState(0);
  const [shared, setShared] = useState(false);

  /**
   * Every picture the product has: its own photos plus any colour's photo, with
   * duplicates dropped. All of them are tappable, and whichever the customer
   * picks fills the big frame.
   */
  const images = (() => {
    const all = [...(product.images || []), ...(product.color_variants || []).map((v) => v.image)];
    return all.filter((src, i): src is string => !!src && all.indexOf(src) === i);
  })();
  // Choosing a colour swaps to that colour's photo; tapping a thumbnail after
  // that means the customer wants the picture they tapped, so it wins.
  const pickColor = (name: string) => {
    setColor(name);
    const img = product.color_variants?.find((x) => x.name === name)?.image;
    const i = img ? images.indexOf(img) : -1;
    if (i >= 0) setThumb(i);
  };
  const activeImage = images[thumb] || images[0] || "";
  const hasSale = product.compare_price && product.compare_price > product.price;

  function share(kind: "facebook" | "twitter" | "copy") {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (kind === "copy") { navigator.clipboard?.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); return; }
    const shareUrl = kind === "facebook"
      ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      : `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(product.name)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
            {activeImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeImage} alt={product.name} fetchPriority="high" className="h-full w-full object-cover" />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setThumb(i)} aria-label={`Show picture ${i + 1}`}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-md border transition"
                  style={{ borderColor: thumb === i ? brandColor : "rgba(0,0,0,0.1)", borderWidth: thumb === i ? 2 : 1 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && <p className="text-xs font-semibold uppercase tracking-wide text-black/45">{product.category}</p>}
          <h1 className="mt-1 text-2xl font-bold uppercase sm:text-3xl">{product.name}</h1>

          {product.is_pre_order ? (
            <span className="mt-3 inline-block rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Pre-order</span>
          ) : (
            <span className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">In stock</span>
          )}

          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold">{formatNaira(product.price)}</span>
            {hasSale && <span className="text-lg text-black/40 line-through">{formatNaira(product.compare_price!)}</span>}
          </div>
          {product.is_pre_order && product.preorder_note && (
            <p className="mt-1 text-sm text-black/55">{product.preorder_note}</p>
          )}

          {colorNames.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium">Colour: <span className="text-black/60">{color}</span></p>
              <div className="mt-2 flex flex-wrap gap-2">
                {colorNames.map((c) => (
                  <button key={c} onClick={() => pickColor(c)}
                    className="rounded-full border px-4 py-2 text-sm font-medium"
                    style={color === c ? { borderColor: brandColor, background: `${brandColor}12` } : { borderColor: "rgba(0,0,0,0.15)" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Size: <span className="text-black/60">{size}</span></p>
                {activeGuide && (
                  <button onClick={() => setGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
                    style={{ color: brandColor }}>
                    <Ruler className="h-4 w-4" /> Size guide
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((v) => (
                  <button key={v.name} onClick={() => setSize(v.name)}
                    className="rounded-full border px-4 py-2 text-sm font-medium"
                    style={size === v.name ? { borderColor: brandColor, background: `${brandColor}12` } : { borderColor: "rgba(0,0,0,0.15)" }}>
                    {v.name}
                  </button>
                ))}
              </div>
              {!activeGuide && (
                <p className="mt-2 text-xs text-black/45">No size guide for {size} yet.</p>
              )}
            </div>
          )}

          {guideOpen && activeGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setGuideOpen(false)}>
              <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                  <p className="font-semibold">Size guide, {size}</p>
                  <button onClick={() => setGuideOpen(false)} aria-label="Close size guide" className="text-black/40 hover:text-black">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeGuide} alt={`Size guide for ${size}`} className="max-h-[75vh] w-full object-contain" />
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-md border border-black/15 px-3 py-2">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-5 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => cart.buyNow(product, variantLabel, qty)}
              className="flex-1 rounded-md px-6 py-3 text-sm font-bold uppercase tracking-wide text-white"
              style={{ background: brandColor }}
            >
              {product.is_pre_order ? "Pre-order Now" : "Buy Now"}
            </button>
          </div>
          <button onClick={() => cart.add(product, variantLabel, qty)} className="mt-2 text-sm font-semibold underline underline-offset-4">
            Add to cart &amp; keep shopping
          </button>

          {product.description && (
            <div className="mt-8 border-t border-black/10 pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-black/50">Description</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/70">{product.description}</p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3 border-t border-black/10 pt-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/50">Share</span>
            <button onClick={() => share("facebook")} aria-label="Share on Facebook" className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15"><Facebook className="h-4 w-4" /></button>
            <button onClick={() => share("twitter")} aria-label="Share on Twitter" className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15"><Twitter className="h-4 w-4" /></button>
            <button onClick={() => share("copy")} aria-label="Copy link" className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15">{shared ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stars({ value, onChange, size = "h-4 w-4" }: { value: number; onChange?: (n: number) => void; size?: string }) {
  return (
    <span className="inline-flex text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} className={onChange ? "cursor-pointer" : "cursor-default"} aria-label={`${n} star`}>
          <Star className={size} fill={n <= Math.round(value) ? "currentColor" : "none"} />
        </button>
      ))}
    </span>
  );
}

function ProductReviews({ siteId, productId, reviews, brandColor }: { siteId: string; productId: string; reviews: Review[]; brandColor: string }) {
  const [list, setList] = useState<Review[]>(reviews);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  async function submit() {
    setError(null);
    if (!name.trim()) { setError("Please enter your name."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, productId, name, email, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit review.");
      setList([{ id: `tmp-${Date.now()}`, site_id: siteId, product_id: productId, reviewer_name: name, reviewer_email: email || null, rating, comment: comment || null, is_published: true, verified_purchase: !!data.verified, created_at: new Date().toISOString() }, ...list]);
      setDone(true); setName(""); setEmail(""); setComment(""); setRating(5);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-t border-black/10 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold uppercase tracking-wide">Reviews</h2>
            <span className="text-lg font-bold">{avg.toFixed(1)}</span>
            <Stars value={avg} />
            <span className="text-sm text-black/45">({list.length})</span>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide text-white" style={{ background: "#111" }}>
            + Add a review
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-2xl border border-black/10 p-5">
            {done ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Thanks for your review!
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 sm:col-span-2"><span className="text-sm text-black/60">Your rating</span><Stars value={rating} onChange={setRating} size="h-5 w-5" /></div>
                <input className="rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                <input className="rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Email (used to verify purchase)" value={email} onChange={(e) => setEmail(e.target.value)} />
                <textarea rows={3} className="rounded-md border border-black/15 px-3 py-2 text-sm sm:col-span-2" placeholder="Share your experience with this product" value={comment} onChange={(e) => setComment(e.target.value)} />
                {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
                <button onClick={submit} disabled={busy} className="flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold text-white sm:col-span-2" style={{ background: brandColor }}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit Review
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 space-y-4">
          {list.length === 0 && <p className="text-sm text-black/50">No reviews yet for this product, be the first to share your experience.</p>}
          {list.map((r) => (
            <div key={r.id} className="rounded-2xl border border-black/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.reviewer_name}</span>
                  {r.verified_purchase && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      <ShieldCheck className="h-3 w-3" /> Verified purchase
                    </span>
                  )}
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="mt-2 text-sm text-black/65">{r.comment}</p>}
              <p className="mt-2 text-xs text-black/40">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
