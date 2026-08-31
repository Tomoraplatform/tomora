import "server-only";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cache tags for published customer sites.
 *
 * Published pages used to be rendered per request, which meant a visitor in
 * Lagos waited for a round trip to a function in Washington and two more to
 * the database before a byte came back, and the first visitor after a quiet
 * spell paid a cold start on top. They are cached now, which only works if
 * every write that changes what a page shows drops the cache for that site.
 *
 * Two kinds of tag:
 *  - `site:<id>` covers a site's content: its data, products and reviews.
 *  - `site-lookup:<type>:<value>` covers the host that resolves to it, so
 *    renaming a subdomain or connecting a domain takes effect at once.
 *
 * Anything missed shows up as an owner's edit not appearing, so the helpers
 * below take whatever the caller happens to have (a site id, a user id) and
 * work out the rest.
 */

export const siteTag = (siteId: string) => `site:${siteId}`;

export const siteLookupTag = (type: "subdomain" | "custom", value: string) =>
  `site-lookup:${type}:${(value || "").toLowerCase()}`;

/** Drops the cached pages for one site. Safe to call with nothing. */
export function revalidateSite(siteId?: string | null): void {
  if (!siteId) return;
  revalidateTag(siteTag(siteId));
}

/**
 * Drops the cached host lookups for a site, for when a subdomain is renamed or
 * a custom domain is connected or removed. Both the old and new values need
 * dropping, so callers pass whichever they know.
 */
export function revalidateSiteHosts(values: {
  subdomain?: string | null;
  customDomain?: string | null;
}): void {
  if (values.subdomain) revalidateTag(siteLookupTag("subdomain", values.subdomain));
  if (values.customDomain) revalidateTag(siteLookupTag("custom", values.customDomain));
}

/**
 * Drops a site's pages and its host lookups, reading the hosts from the row.
 *
 * Used where a write changes addressing as well as content, and by callers
 * that would otherwise have to remember which tags exist.
 */
export async function revalidateSiteFully(siteId?: string | null): Promise<void> {
  if (!siteId) return;
  revalidateSite(siteId);
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("sites").select("subdomain, custom_domain").eq("id", siteId).maybeSingle();
    revalidateSiteHosts({ subdomain: data?.subdomain, customDomain: data?.custom_domain });
  } catch {
    // The content tag is already dropped; a stale host lookup only matters
    // when addressing changed, and those callers pass the values explicitly.
  }
}

/**
 * Drops every site belonging to one person.
 *
 * Billing and admin act on a user rather than a site (going live, going
 * offline, comping a plan), and a user can own several.
 */
export async function revalidateSitesForUser(userId?: string | null): Promise<void> {
  if (!userId) return;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("sites").select("id").eq("user_id", userId);
    for (const row of (data as { id: string }[] | null) || []) revalidateSite(row.id);
  } catch {
    /* best effort: the periodic revalidate is the backstop */
  }
}
