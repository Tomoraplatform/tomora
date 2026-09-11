import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { excludeTestProducts } from "@/lib/orders/query";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCompExpired } from "@/lib/billing";
import { siteLookupTag, siteTag } from "@/lib/site-cache";
import type { Site, Product, Subscription, Review } from "@/lib/database.types";

export interface PublishedSite {
  site: Site;
  products: Product[];
  reviews: Review[];
  isLive: boolean;
}

/** How long a cached page survives without anyone invalidating it. */
const MAX_AGE = 3600;

/**
 * Resolves a host to a site id.
 *
 * Split from the content load so the two can be invalidated separately: a
 * subdomain rename changes this, editing a page changes that.
 */
const siteIdFor = (type: "subdomain" | "custom", value: string) =>
  unstable_cache(
    async () => {
      const admin = createAdminClient();
      const column = type === "custom" ? "custom_domain" : "subdomain";
      const { data } = await admin
        .from("sites").select("id").eq(column, value.toLowerCase()).maybeSingle();
      return (data?.id as string) || null;
    },
    ["site-id", type, value.toLowerCase()],
    { tags: [siteLookupTag(type, value)], revalidate: MAX_AGE }
  )();

/** Everything a published page renders from, for one site. */
const contentFor = (siteId: string) =>
  unstable_cache(
    async () => {
      const admin = createAdminClient();
      const { data: site } = await admin.from("sites").select("*").eq("id", siteId).maybeSingle();
      if (!site) return null;

      const isStore = site.category === "ecommerce";
      const [{ data: sub }, prod, revs] = await Promise.all([
        admin
          .from("subscriptions")
          .select("status, comp_expires_at")
          .eq("user_id", site.user_id)
          .maybeSingle<Pick<Subscription, "status" | "comp_expires_at">>(),
        // A demo store shows its demo stock, since that is the whole point of
        // it. Every other storefront never sees a demo product.
        isStore
          ? (site.is_demo
              ? admin.from("products").select("*").eq("site_id", site.id).eq("is_active", true)
              : excludeTestProducts(admin.from("products").select("*").eq("site_id", site.id).eq("is_active", true))
            ).order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as Product[] }),
        // Best-effort: reviews table may not exist yet (pre-0006 migration).
        isStore
          ? admin.from("reviews").select("*").eq("site_id", site.id).eq("is_published", true)
              .order("created_at", { ascending: false }).limit(50)
              .then((r) => r, () => ({ data: [] as Review[] }))
          : Promise.resolve({ data: [] as Review[] }),
      ]);

      return {
        site: site as Site,
        products: (prod.data as Product[]) || [],
        reviews: (revs.data as Review[]) || [],
        subscription: (sub as Pick<Subscription, "status" | "comp_expires_at">) || null,
      };
    },
    ["site-content", siteId],
    { tags: [siteTag(siteId)], revalidate: MAX_AGE }
  )();

/**
 * Loads a published site by subdomain or custom domain (server-only).
 *
 * Reads only. It used to cancel an expired comped subscription here, which
 * meant a page view could write to the database; a render that mutates cannot
 * be cached, and shouldn't anyway. The gate below still treats an expired comp
 * as offline, and the cancellation happens when the owner next opens their
 * dashboard.
 *
 * Wrapped in React `cache` as well, because every page calls this once for its
 * metadata and again for its body.
 */
export const loadPublishedSite = cache(async (
  type: "subdomain" | "custom",
  value: string
): Promise<PublishedSite | null> => {
  const siteId = await siteIdFor(type, value);
  if (!siteId) return null;

  const content = await contentFor(siteId);
  if (!content) return null;

  const { site, products, reviews, subscription } = content;

  // A published site stays up on the Free plan for as long as its owner likes.
  // It used to go dark when `trial_ends_at` passed; that date is still written
  // at signup but no longer gates anything. What does take a site offline is
  // `is_live` being cleared (a lapsed paid plan, an admin), or a comp running
  // out, which is still treated as offline until the dashboard cancels it.
  const isLive = !isCompExpired(subscription) && (site.is_live as boolean);

  return { site, products, reviews, isLive };
});
