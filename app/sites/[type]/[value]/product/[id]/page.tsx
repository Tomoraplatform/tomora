import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublishedSite } from "@/lib/published";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Review } from "@/lib/database.types";
import { StoreProductPage } from "@/components/published/store/store-product-page";

// Cached and served from the edge, then dropped the moment the owner changes
// anything (see lib/site-cache.ts). The five minutes is only a backstop for a
// write path that forgets to invalidate, kept short while the invalidation
// paths earn trust in production.
export const revalidate = 300;

interface Params { params: { type: string; value: string; id: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  const product = data?.products.find((p) => p.id === params.id);
  if (!data || !product) return { title: "Product not found" };
  const name = data.site.site_data?.businessName || "Store";
  return { title: `${product.name} | ${name}`, description: product.description || undefined };
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
    <StoreProductPage
      site={data.site}
      product={product}
      categoryProducts={data.products}
      reviews={reviews}
      paystackEnabled={!!data.site.paystack_subaccount}
    />
  );
}
