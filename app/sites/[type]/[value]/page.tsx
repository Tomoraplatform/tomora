import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/lib/published";
import { PublishedSiteView } from "@/components/published/published-site-view";
import { CustomHtmlSite, splitDocument } from "@/components/published/custom-html-site";
import type { Metadata } from "next";
import { getCreatorByDomain, listCreatorCourses } from "@/lib/creator/db";
import { CreatorStorefront } from "@/components/creator/creator-storefront";
import { academyOpen } from "@/lib/academy/settings";
import { AcademyClosed } from "@/components/academy/academy-closed";
import { jsonLdHtml, storeJsonLd, storefrontMetadata } from "@/lib/seo/storefront";

// Always render fresh so edits appear immediately after publishing.
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

interface Params {
  params: { type: string; value: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  if (!data) return { title: "Site not found", robots: { index: false, follow: false } };

  const base = storefrontMetadata(data.site, data.isLive, { path: "/" });

  // A site hosting its own HTML keeps that file's title and favicon exactly.
  // It still needs its own canonical address, or it inherits Tomora's.
  const customUrl = (data.site as { custom_html_url?: string | null }).custom_html_url;
  if (customUrl) {
    const html = await loadCustomHtml(customUrl);
    if (html) {
      const { title, icon } = splitDocument(html);
      return {
        ...base,
        ...(title ? { title: { absolute: title } } : {}),
        ...(icon ? { icons: { icon, shortcut: icon, apple: icon } } : {}),
      };
    }
  }

  return base;
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

  // Sites that uploaded their own HTML render that file exactly, not a template.
  const customUrl = (data.site as { custom_html_url?: string | null }).custom_html_url;
  if (customUrl) {
    const html = await loadCustomHtml(customUrl);
    if (html) return <CustomHtmlSite html={html} />;
  }

  return (
    <>
      {data.isLive && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(storeJsonLd(data.site)) }} />
      )}
      <PublishedSiteView site={data.site} products={data.products} reviews={data.reviews} isLive={data.isLive} />
    </>
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

/** Fetches an uploaded site HTML file, cached at the edge so renders stay fast. */
async function loadCustomHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
