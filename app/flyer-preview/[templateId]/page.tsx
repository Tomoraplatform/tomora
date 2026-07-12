import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteRenderer } from "@/components/templates";
import { createCatalogContent, isCatalogTemplate, catalogTemplate, richStoreCatalog } from "@/lib/catalog";

/**
 * Marketing-only template preview with rich demo content — used to capture
 * screenshots/recordings of templates for flyers and social assets.
 * Not linked anywhere and excluded from search indexing.
 */
export const metadata: Metadata = { title: "Template preview", robots: { index: false, follow: false } };

const DEMO: Record<string, { name: string }> = {
  shop: { name: "Ada Styles" },
  portfolio: { name: "Tolu Adeyemi" },
  education: { name: "Bright Path Academy" },
  organization: { name: "Open Heart Foundation" },
  events: { name: "Lagos Fest" },
  artisan: { name: "Zuri Atelier" },
};

export default function FlyerPreviewPage({ params }: { params: { templateId: string } }) {
  const id = params.templateId;
  if (!isCatalogTemplate(id)) notFound();
  const tpl = catalogTemplate(id)!;
  const businessName = DEMO[tpl.category]?.name || "Your Brand";
  const brandColor = tpl.accent || "#022245";

  const data = createCatalogContent(id, { businessName, brandColor });
  if (data.products?.length) {
    const { products, categories } = richStoreCatalog(id);
    data.products = products;
    data.shopCategories = categories;
    data.testimonials = [
      { id: "rt1", name: "Amara O.", role: "Customer", quote: "Beautiful pieces and my order arrived so fast. This is now my go-to store!" },
      { id: "rt2", name: "Tunde B.", role: "Customer", quote: "Quality is even better than the photos. Checkout was smooth too." },
      { id: "rt3", name: "Grace M.", role: "Customer", quote: "Loved the packaging and the customer support was excellent." },
    ];
  }

  return <SiteRenderer templateId={id} siteData={data} brandColor={brandColor} />;
}
