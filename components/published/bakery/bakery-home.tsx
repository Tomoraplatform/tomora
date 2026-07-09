"use client";

import Link from "next/link";
import type { Product, Site } from "@/lib/database.types";
import { slugify } from "@/lib/utils";
import { productCategories } from "@/components/templates/v2/shared";
import { BakeryChrome } from "./bakery-chrome";
import { BakeryProductCard } from "./bakery-product-card";

export function BakeryHome({
  site, products, paystackEnabled,
}: {
  site: Site;
  products: Product[];
  paystackEnabled: boolean;
}) {
  const siteData = site.site_data;
  const brandColor = siteData?.brandColor || "#022245";
  const newArrivals = products.filter((p) => p.is_new_arrival).slice(0, 4);
  const shownArrivals = newArrivals.length ? newArrivals : products.slice(0, 4);
  const catalogCats = productCategories(products.map((p) => ({ id: p.id, name: p.name, price: p.price, image: p.images?.[0] || "", category: p.category || undefined })));
  const categories = siteData?.shopCategories?.length ? siteData.shopCategories : catalogCats.map((c, i) => ({ id: `c${i}`, name: c.name, image: c.image }));
  const featured = products.find((p) => p.is_best_seller) || products[0];

  return (
    <BakeryChrome
      siteData={siteData} brandColor={brandColor} siteId={site.id} products={products}
      bankName={site.bank_name} accountNumber={site.account_number} accountName={site.account_name} paystackEnabled={paystackEnabled}
    >
      {/* Hero */}
      <section className="relative">
        {siteData?.heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={siteData.heroImage} alt="" className="h-[420px] w-full object-cover sm:h-[520px]" />
        )}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-4 px-5 text-center text-white">
          <h1 className="max-w-lg text-3xl font-bold sm:text-4xl">{siteData?.heroHeadline}</h1>
          <Link href="#newarrivals" className="rounded-md px-6 py-3 text-sm font-semibold" style={{ background: brandColor }}>
            {siteData?.ctaText || "Shop Now"}
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      <section id="newarrivals" className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold uppercase tracking-wide">{siteData?.sectionTitles?.newarrivals || "New Arrivals"}</h2>
          <a href="#featured" className="text-sm font-medium" style={{ color: brandColor }}>See more →</a>
        </div>
        {shownArrivals.length === 0 ? (
          <p className="mt-6 text-sm text-black/50">Products you add in your dashboard will appear here.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
            {shownArrivals.map((p) => <BakeryProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Shop by category */}
      {categories.length > 0 && (
        <section id="categories" className="bg-[#FAF7F2]">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold uppercase tracking-wide">{siteData?.sectionTitles?.categories || "Shop by Category"}</h2>
              <a href="#newarrivals" className="text-sm font-medium" style={{ color: brandColor }}>See more →</a>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {categories.slice(0, 6).map((c) => (
                <Link key={c.id || c.name} href={`/category/${slugify(c.name)}`} className="group relative block aspect-[4/5] overflow-hidden rounded-lg">
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-black/25" />
                  <span className="absolute inset-x-3 bottom-3 text-sm font-bold uppercase tracking-wide text-white">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured && (
        <section id="featured" className="mx-auto max-w-6xl px-5 py-14">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold uppercase tracking-wide">{siteData?.sectionTitles?.featured || "Featured"}</h2>
          </div>
          <div className="mt-8 max-w-xs">
            <BakeryProductCard product={featured} />
          </div>
        </section>
      )}
    </BakeryChrome>
  );
}
