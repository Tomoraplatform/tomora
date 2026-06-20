import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/lib/published";
import { PublishedSiteView } from "@/components/published/published-site-view";
import type { Metadata } from "next";

// Always render fresh so edits appear immediately after publishing.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Params {
  params: { type: string; value: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  if (!data) return { title: "Site not found" };
  const name = data.site.site_data?.businessName || "Website";
  return {
    title: name,
    description: data.site.site_data?.tagline || `${name} — built with Tomora`,
  };
}

export default async function PublishedSitePage({ params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));

  if (!data) notFound();

  return (
    <PublishedSiteView site={data.site} products={data.products} isLive={data.isLive} />
  );
}
