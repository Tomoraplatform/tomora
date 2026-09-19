import { loadPublishedSite } from "@/lib/published";
import { storeOrigin } from "@/lib/seo/storefront";
import { slugify } from "@/lib/utils";

/**
 * sitemap.xml for a customer's published site, at its own address.
 *
 * Middleware rewrites every path on a store's host into /sites/<type>/<value>,
 * so a request for yourshop.tomora.com.ng/sitemap.xml lands here. Before this
 * existed it fell through to the store's 404, and the only sitemap anywhere was
 * Tomora's own, which lists none of the stores.
 *
 * Lists exactly the pages that render: the home page, the extra pages only the
 * shop-07 template has, every active product, and every category that has a
 * tile or at least one product (the same rule the category page uses).
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

interface Params {
  params: { type: string; value: string };
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export async function GET(_request: Request, { params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));

  // Unknown or offline site: an empty sitemap, which says "nothing to crawl".
  const urls: { loc: string; lastmod?: string; priority: string }[] = [];

  if (data && data.isLive) {
    const { site, products } = data;
    const origin = storeOrigin(site);
    const siteUpdated = (site as { updated_at?: string }).updated_at || site.created_at;

    urls.push({ loc: origin, lastmod: siteUpdated, priority: "1.0" });

    if (site.template_id === "shop-07") {
      for (const path of ["/shop", "/about", "/contact"]) {
        urls.push({ loc: `${origin}${path}`, lastmod: siteUpdated, priority: path === "/shop" ? "0.9" : "0.5" });
      }
    }

    if (site.category === "ecommerce") {
      const slugs = new Set<string>();
      for (const tile of site.site_data?.shopCategories || []) {
        if (tile?.name) slugs.add(slugify(tile.name));
      }
      for (const p of products) {
        if (p.category) slugs.add(slugify(p.category));
      }
      for (const slug of Array.from(slugs)) {
        if (slug) urls.push({ loc: `${origin}/category/${slug}`, lastmod: siteUpdated, priority: "0.7" });
      }
      for (const p of products) {
        urls.push({ loc: `${origin}/product/${p.id}`, lastmod: p.created_at, priority: "0.8" });
      }
    }
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${escapeXml(u.loc)}</loc>` +
          (u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : "") +
          `<priority>${u.priority}</priority></url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
