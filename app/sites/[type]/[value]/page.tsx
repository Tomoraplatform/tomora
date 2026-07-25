import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/lib/published";
import { PublishedSiteView } from "@/components/published/published-site-view";
import type { Metadata } from "next";
import { getCreatorByDomain, listCreatorCourses } from "@/lib/creator/db";
import { CreatorStorefront } from "@/components/creator/creator-storefront";
import { academyOpen } from "@/lib/academy/settings";
import { AcademyClosed } from "@/components/academy/academy-closed";

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
  const description = data.site.site_data?.tagline || `${name}, built with Tomora`;
  const ogImage = data.site.site_data?.heroImage || data.site.site_data?.logoUrl;
  const favicon = data.site.site_data?.faviconUrl;
  return {
    title: name,
    description,
    ...(favicon ? { icons: { icon: favicon, shortcut: favicon, apple: favicon } } : {}),
    openGraph: {
      type: "website",
      title: name,
      description,
      siteName: name,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: name,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function PublishedSitePage({ params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const value = decodeURIComponent(params.value);
  const data = await loadPublishedSite(type, value);

  // A custom domain can also belong to a creator's sales pages.
  if (!data && type === "custom") {
    const creatorPage = await renderCreatorDomain(value);
    if (creatorPage) return creatorPage;
  }

  if (!data) notFound();

  return (
    <PublishedSiteView site={data.site} products={data.products} reviews={data.reviews} isLive={data.isLive} />
  );
}

/** Serves a creator's storefront when the host is their connected domain. */
async function renderCreatorDomain(host: string) {
  const creator = await getCreatorByDomain(host);
  if (!creator) return null;
  if (!(await academyOpen())) return <AcademyClosed />;
  const all = await listCreatorCourses(creator.id);
  const live = all.filter((c) => c.is_published && c.is_active);
  // On a custom domain the pages live at the root, not under /c/<slug>.
  return <CreatorStorefront creator={creator} courses={live} hrefFor={(slug) => `/${slug}`} />;
}
