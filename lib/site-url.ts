import { APP_DOMAIN } from "./constants";

/**
 * Returns the working public URL for a published site.
 *
 * - Active custom domain  -> https://customdomain.com
 * - Hosts without wildcard DNS (e.g. *.vercel.app, localhost) -> path-based
 *   https://app-domain/s/<subdomain>  (works immediately, no DNS needed)
 * - A real apex domain with wildcard  -> https://<subdomain>.app-domain
 */
export function siteLiveUrl(site: {
  subdomain: string;
  custom_domain?: string | null;
  domain_status?: string | null;
}): string {
  if (site.custom_domain && site.domain_status === "active") {
    return `https://${site.custom_domain}`;
  }
  const d = APP_DOMAIN;
  const noWildcard = d.endsWith(".vercel.app") || d.includes("localhost");
  return noWildcard
    ? `https://${d}/s/${site.subdomain}`
    : `https://${site.subdomain}.${d}`;
}
