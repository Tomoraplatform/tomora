import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublishedSite } from "@/lib/published";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Review } from "@/lib/database.types";
import { StoreProductPage } from "@/components/published/store/store-product-page";
import { jsonLdHtml, productJsonLd, storefrontMetadata } from "@/lib/seo/storefront";

// Cached and served from the edge, then dropped the moment the owner changes
// anything (see lib/site-cache.ts). The five minutes is only a backstop for a
// write path that forgets to invalidate, kept short while the invalidation
// paths earn trust in production.
export const revalidate = 300;

// Nothing is prerendered at build: sites are created and renamed constantly, so
// the addresses are not known then. Declaring the list as empty is what marks
// the route cacheable at all; without it Next treats a dynamic segment as
// always-dynamic and Vercel answers every request with no-store, which is why
// the first attempt at this changed nothing. Unknown addresses are rendered on
// first request and cached from then on.
export async function generateStaticParams() {
  return [];
}

interface Params { params: { type: string; value: string; id: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  const product = data?.products.find((p) => p.id === params.id);
  if (!data || !product) return { title: "Product not found", robots: { index: false, follow: false } };
  return storefrontMetadata(data.site, data.isLive, {
    path: `/product/${product.id}`,
    title: product.name,
    description: product.description,
    image: product.images?.[0],
  });
}

export default async function ProductPage({ params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  if (!data || !data.isLive || data.site.category !== "ecommerce") notFound();

  const product = data.products.find((p) => p.id === params.id);
  if (!product) notFound();

  // Reviews for this exact product (published only).
  const admin = createAdminClient();
  let reviews: Review[] = [];
  try {
    const { data: revs } = await admin
      .from("reviews").select("*")
      .eq("site_id", data.site.id).eq("product_id", product.id).eq("is_published", true)
      .order("created_at", { ascending: false });
    reviews = (revs as Review[]) || [];
  } catch {
    reviews = [];
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(productJsonLd(data.site, product, reviews)) }}
      />
      <StoreProductPage
        site={data.site}
        product={product}
        categoryProducts={data.products}
        reviews={reviews}
        paystackEnabled={!!data.site.paystack_subaccount}
      />
    </>
  );
}
