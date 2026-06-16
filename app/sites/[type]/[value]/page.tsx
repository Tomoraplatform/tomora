import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/lib/published";
import { OfflineSite } from "@/components/published/offline";
import { SiteRenderer } from "@/components/templates";
import { PublishedStore } from "@/components/published/published-store";
import type { Metadata } from "next";

interface Params {
  params: { type: string; value: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));
  if (!data) return { title: "Site not found" };
  const name = data.site.site_data?.businessName || "Website";
  return {
    title: name,
    description: data.site.site_data?.tagline || `${name} — built with Tomora`,
  };
}

export default async function PublishedSitePage({ params }: Params) {
  const type = params.type === "custom" ? "custom" : "subdomain";
  const data = await loadPublishedSite(type, decodeURIComponent(params.value));

  if (!data) notFound();

  const { site, products, isLive } = data;
  if (!isLive) {
    return <OfflineSite businessName={site.site_data?.businessName} />;
  }

  // E-commerce sites get the interactive storefront (cart + Paystack checkout).
  if (site.category === "ecommerce") {
    return (
      <PublishedStore
        templateId={site.template_id}
        siteData={site.site_data}
        brandColor={site.site_data?.brandColor || "#022245"}
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
      brandColor={site.site_data?.brandColor || "#022245"}
    />
  );
}
