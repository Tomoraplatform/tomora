"use client";

import Link from "next/link";
import type { Product, Site } from "@/lib/database.types";
import { BakeryChrome } from "./bakery-chrome";
import { BakeryProductCard } from "./bakery-product-card";

export function BakeryCategory({
  site, products, categoryName, paystackEnabled,
}: {
  site: Site;
  /** Products already filtered to this category. */
  products: Product[];
  categoryName: string;
  paystackEnabled: boolean;
}) {
  const siteData = site.site_data;
  const brandColor = siteData?.brandColor || "#022245";
  const tile = (siteData?.shopCategories || []).find((c) => c.name.toLowerCase() === categoryName.toLowerCase());

  return (
    <BakeryChrome
      siteData={siteData} brandColor={brandColor} siteId={site.id} products={products}
      bankName={site.bank_name} accountNumber={site.account_number} accountName={site.account_name} paystackEnabled={paystackEnabled}
    >
      <section className="relative">
        {tile?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tile.image} alt="" className="h-52 w-full object-cover sm:h-64" />
        )}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex items-end">
          <h1 className="px-5 pb-8 text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">{categoryName}</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pt-6">
        <p className="flex items-center gap-1.5 text-sm text-black/50">
          <Link href="/" className="hover:text-black">Home</Link> <span>›</span> <span className="text-black">{categoryName}</span>
        </p>
        <div className="mt-3 flex items-center justify-between border-b border-black/10 pb-4">
          <span className="text-sm text-black/50">{products.length} product{products.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-8">
        {products.length === 0 ? (
          <p className="py-10 text-center text-sm text-black/50">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {products.map((p) => <BakeryProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </BakeryChrome>
  );
}
