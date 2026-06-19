import { OfflineSite } from "./offline";
import { SiteRenderer } from "@/components/templates";
import { PublishedStore } from "./published-store";
import type { Product, Site } from "@/lib/database.types";

/**
 * Renders a published site: offline screen when not live (unless `preview`),
 * the interactive storefront for e-commerce, or the plain template otherwise.
 * Shared by the public routes and the owner preview.
 */
export function PublishedSiteView({
  site,
  products,
  isLive,
  preview = false,
}: {
  site: Site;
  products: Product[];
  isLive: boolean;
  preview?: boolean;
}) {
  if (!isLive && !preview) {
    return <OfflineSite businessName={site.site_data?.businessName} />;
  }

  const brandColor = site.site_data?.brandColor || "#022245";

  if (site.category === "ecommerce") {
    return (
      <PublishedStore
        templateId={site.template_id}
        siteData={site.site_data}
        brandColor={brandColor}
        products={products}
        siteId={site.id}
        paystackPublicKey={site.paystack_public_key}
      />
    );
  }

  return (
    <SiteRenderer
      templateId={site.template_id}
      siteData={site.site_data}
      brandColor={brandColor}
      products={products}
    />
  );
}
