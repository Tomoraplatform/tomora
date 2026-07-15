import { OfflineSite } from "./offline";
import { SiteRenderer } from "@/components/templates";
import { PublishedStore } from "./published-store";
import { SupportChat } from "./support-chat";
import { VisitBeacon } from "./visit-beacon";
import { BakehouseHome } from "./bakehouse-home";
import { ChronovaHome } from "./chronova/chronova-home";
import type { Product, Review, Site } from "@/lib/database.types";

/**
 * Renders a published site: offline screen when not live (unless `preview`),
 * the interactive storefront for e-commerce, or the plain template otherwise.
 * Shared by the public routes and the owner preview.
 */
export function PublishedSiteView({
  site,
  products,
  reviews = [],
  isLive,
  preview = false,
}: {
  site: Site;
  products: Product[];
  reviews?: Review[];
  isLive: boolean;
  preview?: boolean;
}) {
  if (!isLive && !preview) {
    return <OfflineSite businessName={site.site_data?.businessName} />;
  }

  const brandColor = site.site_data?.brandColor || "#022245";
  // Live sites get the support chat widget; visitor messages land in the
  // owner's dashboard inbox.
  const chat = isLive ? <SupportChat siteId={site.id} brandColor={brandColor} /> : null;
  const beacon = isLive ? <VisitBeacon siteId={site.id} /> : null;

  if (site.category === "ecommerce") {
    // Every ecommerce site is a real multi-page storefront now — home,
    // /category/[slug] and /product/[id] are genuine routes with working
    // links — but that navigation only resolves on the actual published site,
    // not the same-origin dashboard preview. Bakehouse additionally has its
    // own bespoke home page (the other templates keep their existing homes).
    const tenantHost = isLive && !preview;
    if (site.template_id === "shop-06" && tenantHost) {
      return (
        <>
          <BakehouseHome site={site} products={products} paystackEnabled={!!site.paystack_subaccount} />
          {chat}
          {beacon}
        </>
      );
    }
    if (site.template_id === "shop-07" && tenantHost) {
      return (
        <>
          <ChronovaHome site={site} products={products} paystackEnabled={!!site.paystack_subaccount} />
          {chat}
          {beacon}
        </>
      );
    }
    return (
      <>
        <PublishedStore
          templateId={site.template_id}
          siteData={site.site_data}
          brandColor={brandColor}
          products={products}
          reviews={reviews}
          siteId={site.id}
          bankName={site.bank_name}
          accountNumber={site.account_number}
          accountName={site.account_name}
          paystackEnabled={!!site.paystack_subaccount}
          isTenantHost={tenantHost}
        />
        {chat}
        {beacon}
      </>
    );
  }

  return (
    <>
      <SiteRenderer
        templateId={site.template_id}
        siteData={site.site_data}
        brandColor={brandColor}
        products={products}
        siteId={isLive ? site.id : undefined}
      />
      {chat}
      {beacon}
    </>
  );
}
