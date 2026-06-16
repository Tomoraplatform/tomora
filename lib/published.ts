import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Site, Product, Subscription } from "@/lib/database.types";

export interface PublishedSite {
  site: Site;
  products: Product[];
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
  let isLive = site.is_live as boolean;
  if (isLive && site.trial_ends_at) {
    const trialOver = new Date(site.trial_ends_at).getTime() < Date.now();
    if (trialOver) {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("status")
        .eq("user_id", site.user_id)
        .maybeSingle<Pick<Subscription, "status">>();
      isLive = sub?.status === "active";
    }
  }

  let products: Product[] = [];
  if (site.category === "ecommerce") {
    const { data } = await admin
      .from("products")
      .select("*")
      .eq("site_id", site.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    products = (data as Product[]) || [];
  }

  return { site: site as Site, products, isLive };
}
