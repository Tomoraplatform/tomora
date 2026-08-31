import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublishedSite } from "@/lib/published";
import { slugify } from "@/lib/utils";
import { StoreCategoryPage } from "@/components/published/store/store-category-page";

// Cached and served from the edge, then dropped the moment the owner changes
// anything (see lib/site-cache.ts). The hour is only a backstop for a write
// path that forgets to invalidate.
export const revalidate = 3600;

interface Params { params: { type: string; value: string; slug: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  if (!data) return { title: "Not found" };
  const name = data.site.site_data?.businessName || "Store";
  return { title: `${decodeURIComponent(params.slug)} | ${name}` };
}

export default async function CategoryPage({ params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  if (!data || !data.isLive || data.site.category !== "ecommerce") notFound();

  const slug = decodeURIComponent(params.slug);
  const inCategory = data.products.filter((p) => slugify(p.category || "") === slug);
  const tile = (data.site.site_data?.shopCategories || []).find((c) => slugify(c.name) === slug);
  if (inCategory.length === 0 && !tile) notFound();

  const categoryName = inCategory[0]?.category || tile?.name || slug;

  return (
    <StoreCategoryPage
      site={data.site}
      products={inCategory}
      categoryName={categoryName}
      paystackEnabled={!!data.site.paystack_subaccount}
    />
  );
}
