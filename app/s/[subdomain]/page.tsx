import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublishedSite } from "@/lib/published";
import { PublishedSiteView } from "@/components/published/published-site-view";
import { storefrontMetadata } from "@/lib/seo/storefront";

// Always render fresh so edits appear immediately after publishing.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Params {
  params: { subdomain: string };
}

/**
 * Path-based public URL for a published site: /s/<subdomain>.
 * Works on any host (including *.vercel.app where wildcard subdomains are not
 * available). Real subdomain hosts are still handled by middleware → /sites.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await loadPublishedSite("subdomain", decodeURIComponent(params.subdomain));
  if (!data) return { title: "Site not found", robots: { index: false, follow: false } };
  // The same site also lives at its own address; the canonical sends search
  // engines there so this path never competes with it.
  return storefrontMetadata(data.site, data.isLive, { path: "/" });
}

export default async function PublicSiteByPath({ params }: Params) {
  const data = await loadPublishedSite("subdomain", decodeURIComponent(params.subdomain));
  if (!data) notFound();
  return (
    <PublishedSiteView site={data.site} products={data.products} reviews={data.reviews} isLive={data.isLive} />
  );
}
