import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublishedSite } from "@/lib/published";
import { PublishedSiteView } from "@/components/published/published-site-view";

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
  if (!data) return { title: "Site not found" };
  const name = data.site.site_data?.businessName || "Website";
  return {
    title: name,
    description: data.site.site_data?.tagline || `${name} — built with Tomora`,
  };
}

export default async function PublicSiteByPath({ params }: Params) {
  const data = await loadPublishedSite("subdomain", decodeURIComponent(params.subdomain));
  if (!data) notFound();
  return (
    <PublishedSiteView site={data.site} products={data.products} isLive={data.isLive} />
  );
}
