import "server-only";
import { cache } from "react";
import { excludeTestProducts } from "@/lib/orders/query";
import { createAdminClient } from "@/lib/supabase/admin";
import { expireCompIfDue } from "@/lib/billing";
import type { Site, Product, Subscription, Review } from "@/lib/database.types";

export interface PublishedSite {
  site: Site;
  products: Product[];
  reviews: Review[];
  isLive: boolean;
}

/**
 * Loads a published site by subdomain or custom domain (server-only).
 *
 * Wrapped in React `cache`, because every page calls this once for its metadata
 * and again for its body: without it a single visit runs the whole set of
 * queries twice. Independent queries run together rather than one after the
 * other, since a visitor waits for the slowest, not the sum.
 */
export const loadPublishedSite = cache(async (
  type: "subdomain" | "custom",
  value: string
): Promise<PublishedSite | null> => {
  const admin = createAdminClient();
  const column = type === "custom" ? "custom_domain" : "subdomain";

  const { data: site } = await admin
    .from("sites")
    .select("*")
    .eq(column, value.toLowerCase())
    .maybeSingle();

  if (!site) return null;

  const isStore = site.category === "ecommerce";
  const [{ data: sub }, prod, revs] = await Promise.all([
    // Live status: explicit flag + trial / subscription guard.
    admin
      .from("subscriptions")
      .select("status, comp_expires_at")
      .eq("user_id", site.user_id)
      .maybeSingle<Pick<Subscription, "status" | "comp_expires_at">>(),
    // A demo store shows its demo stock, since that is the whole point of it.
    // Every other storefront never sees a demo product.
    isStore
      ? (site.is_demo
          ? admin.from("products").select("*").eq("site_id", site.id).eq("is_active", true)
          : excludeTestProducts(admin.from("products").select("*").eq("site_id", site.id).eq("is_active", true))
        ).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Product[] }),
    // Best-effort: reviews table may not exist yet (pre-0006 migration).
    isStore
      ? admin.from("reviews").select("*").eq("site_id", site.id).eq("is_published", true).order("created_at", { ascending: false }).limit(50)
          .then((r) => r, () => ({ data: [] as Review[] }))
      : Promise.resolve({ data: [] as Review[] }),
  ]);

  // Expire any comp whose period has ended (takes the site offline).
  const compExpired = await expireCompIfDue(site.user_id, sub);
  const subActive = !compExpired && sub?.status === "active";

  let isLive = site.is_live as boolean;
  if (compExpired) {
    isLive = false;
  } else if (isLive && site.trial_ends_at) {
    const trialOver = new Date(site.trial_ends_at).getTime() < Date.now();
    if (trialOver) isLive = subActive;
  }

  return {
    site: site as Site,
    products: (prod.data as Product[]) || [],
    reviews: (revs.data as Review[]) || [],
    isLive,
  };
});
