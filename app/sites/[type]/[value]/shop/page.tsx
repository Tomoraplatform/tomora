import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublishedSite } from "@/lib/published";
import { ChronovaShop } from "@/components/published/chronova/chronova-shop";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Params { params: { type: string; value: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  const name = data?.site.site_data?.businessName || "Store";
  return { title: `Shop | ${name}` };
}

export default async function ShopPage({ params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  if (!data || !data.isLive || data.site.template_id !== "shop-07") notFound();
  return <ChronovaShop site={data.site} products={data.products} paystackEnabled={!!data.site.paystack_subaccount} />;
}
