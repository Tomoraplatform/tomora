import Link from "next/link";
import type { Product, Site } from "@/lib/database.types";
import { slugify } from "@/lib/utils";
import { productCategories } from "@/components/templates/v2/shared";
import { StoreProductCard } from "../store/store-product-card";
import { ChronovaShell } from "./chronova-shell";

/** Chronova live shop page — all products with category filter links. */
export function ChronovaShop({
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

  return (
    <ChronovaShell site={site} paystackEnabled={paystackEnabled}>
      <div className="bg-[#F3F3F2]">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore Watches</h1>
          <p className="mt-2 text-neutral-500">Browse the full collection across styles and eras.</p>

          {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: "#17181b" }}>All</span>
              {categories.slice(0, 6).map((c) => (
                <Link key={c.id || c.name} href={`/category/${slugify(c.name)}`} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-500">{c.name}</Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <p className="mt-10 text-sm text-neutral-500">No products yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <div key={p.id} className="rounded-2xl bg-white p-3">
                  <StoreProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChronovaShell>
  );
}
