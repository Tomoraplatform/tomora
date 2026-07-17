import Link from "next/link";
import { ShieldCheck, RotateCcw, Truck } from "lucide-react";
import type { Product, Site } from "@/lib/database.types";
import { slugify, formatNaira } from "@/lib/utils";
import { productCategories } from "@/components/templates/v2/shared";
import { StoreProductCard } from "../store/store-product-card";
import { ChronovaShell } from "./chronova-shell";

/** Chronova live home page, watch-store hero + product grid + categories + featured. */
export function ChronovaHome({
  site, products, paystackEnabled,
}: {
  site: Site;
  products: Product[];
  paystackEnabled: boolean;
}) {
  const siteData = site.site_data;
  const brandColor = siteData?.brandColor || "#2E7DF6";
  const catalogCats = productCategories(products.map((p) => ({ id: p.id, name: p.name, price: p.price, image: p.images?.[0] || "", category: p.category || undefined })));
  const categories = siteData?.shopCategories?.length ? siteData.shopCategories : catalogCats.map((c, i) => ({ id: `c${i}`, name: c.name, image: c.image }));
  const featured = products.find((p) => p.is_best_seller) || products[0];
  const grid = products.slice(0, 9);

  const trust = [
    { icon: ShieldCheck, title: siteData?.trustBadges?.[0]?.title || "100% Genuine", sub: siteData?.trustBadges?.[0]?.subtitle || "Verified by our watchmakers" },
    { icon: RotateCcw, title: siteData?.trustBadges?.[1]?.title || "30-Day Returns", sub: siteData?.trustBadges?.[1]?.subtitle || "Easy, no-questions swaps" },
    { icon: Truck, title: siteData?.trustBadges?.[2]?.title || "Insured Delivery", sub: siteData?.trustBadges?.[2]?.subtitle || "Tracked to your door" },
  ];

  return (
    <ChronovaShell site={site} paystackEnabled={paystackEnabled}>
      <div className="bg-[#F3F3F2]">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2">
          <div>
            {siteData?.sectionEyebrows?.hero && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs text-black/60 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: brandColor }} />
                {siteData.sectionEyebrows.hero}
              </span>
            )}
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{siteData?.heroHeadline || "Timepieces for the long run."}</h1>
            {siteData?.heroSubtext && <p className="mt-4 max-w-md text-neutral-500">{siteData.heroSubtext}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: brandColor }}>{siteData?.ctaText || "Shop the Collection"}</Link>
              <Link href="/shop" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold">{siteData?.sectionButtons?.hero?.text || "Browse Best Sellers"}</Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-7">
              {trust.map((t, i) => {
                const Icon = t.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5" />
                    <div><p className="text-sm font-semibold">{t.title}</p><p className="text-xs text-neutral-500">{t.sub}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative flex min-h-[360px] items-center justify-center">
            <div className="absolute aspect-square w-[92%] max-w-md rounded-full" style={{ background: "radial-gradient(circle at 50% 40%, #fff, #e9e9e7)" }} />
            {featured && (
              <Link href={`/product/${featured.id}`} className="relative aspect-square w-[72%] max-w-xs overflow-hidden rounded-3xl bg-white shadow-2xl">
                {featured.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.images[0]} alt={featured.name} className="h-full w-full object-cover" />
                )}
                <div className="absolute bottom-4 right-4 rounded-2xl bg-white px-4 py-3 shadow-lg">
                  <p className="text-[11px] text-neutral-500">{featured.name}</p>
                  <p className="text-base font-bold">{formatNaira(featured.price)}</p>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* Product grid */}
        <section className="mx-auto max-w-6xl px-5 py-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{siteData?.sectionTitles?.shop || "Explore the collection"}</h2>
            <Link href="/shop" className="text-sm font-semibold" style={{ color: brandColor }}>View all →</Link>
          </div>
          {categories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/shop" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: "#17181b" }}>All</Link>
              {categories.slice(0, 5).map((c) => (
                <Link key={c.id || c.name} href={`/category/${slugify(c.name)}`} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-500">{c.name}</Link>
              ))}
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {grid.map((p) => (
              <div key={p.id} className="rounded-2xl bg-white p-3">
                <StoreProductCard product={p} />
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 py-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{siteData?.sectionTitles?.categories || "Shop by style"}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {categories.slice(0, 6).map((c) => (
                <Link key={c.id || c.name} href={`/category/${slugify(c.name)}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl">
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-black/25" />
                  <span className="absolute inset-x-4 bottom-4 text-base font-bold text-white">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </ChronovaShell>
  );
}
