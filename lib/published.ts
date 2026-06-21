import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { expireCompIfDue } from "@/lib/billing";
import type { Site, Product, Subscription, Review } from "@/lib/database.types";

export interface PublishedSite {
  site: Site;
  products: Product[];
  reviews: Review[];
  isLive: boolean;
}

/** Loads a published site by subdomain or custom domain (server-only). */
export async function loadPublishedSite(
  type: "subdomain" | "custom",
  value: string
): Promise<PublishedSite | null> {
  const admin = createAdminClient();
  const column = type === "custom" ? "custom_domain" : "subdomain";

  const { data: site } = await admin
    .from("sites")
    .select("*")
    .eq(column, value.toLowerCase())
    .maybeSingle();

  if (!site) return null;

  // Determine live status: explicit flag + trial / subscription guard.
  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, comp_expires_at")
    .eq("user_id", site.user_id)
    .maybeSingle<Pick<Subscription, "status" | "comp_expires_at">>();

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

  let products: Product[] = [];
  let reviews: Review[] = [];
  if (site.category === "ecommerce") {
    const { data: prod } = await admin
      .from("products").select("*").eq("site_id", site.id).eq("is_active", true).order("created_at", { ascending: false });
    products = (prod as Product[]) || [];
    // Best-effort: reviews table may not exist yet (pre-0006 migration).
    try {
      const { data: revs } = await admin
        .from("reviews").select("*").eq("site_id", site.id).eq("is_published", true).order("created_at", { ascending: false }).limit(50);
      reviews = (revs as Review[]) || [];
    } catch {
      reviews = [];
    }
  }

  return { site: site as Site, products, reviews, isLive };
}
