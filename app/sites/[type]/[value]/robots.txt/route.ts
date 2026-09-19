import { loadPublishedSite } from "@/lib/published";
import { storeOrigin } from "@/lib/seo/storefront";

/**
 * robots.txt for a customer's published site, at its own address.
 *
 * Middleware rewrites every path on a store's host into /sites/<type>/<value>,
 * so this is what yourshop.tomora.com.ng/robots.txt serves. It points crawlers
 * at the store's own sitemap. An offline site asks not to be crawled.
 *
 * Search and AI crawlers are named explicitly and allowed: being found and
 * quoted by AI assistants is now part of being found at all.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

interface Params {
  params: { type: string; value: string };
}

const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "Bingbot",
];

export async function GET(_request: Request, { params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));

  let body: string;
  if (data && data.isLive) {
    const origin = storeOrigin(data.site);
    const agents = ["*", ...AI_CRAWLERS].map((a) => `User-agent: ${a}`).join("\n");
    body = `${agents}\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;
  } else if (data) {
    // A site that exists but is offline.
    body = "User-agent: *\nDisallow: /\n";
  } else {
    // Not a site at all: most often a creator's course pages on their own
    // domain, which are public and should stay crawlable.
    body = "User-agent: *\nAllow: /\nDisallow: /api/\n";
  }

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
