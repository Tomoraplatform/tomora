"use client";

import type { ComponentType } from "react";
import type { Product, SiteData, CatalogProduct } from "@/lib/database.types";
import { TemplateEditContext, type TemplateEditApi } from "./editor-context";
import { StoreContext, type StoreApi } from "./store-context";
import { DonationProvider } from "./donation-context";
import type { TemplateProps } from "./shared";
import { isDemoReview } from "@/lib/catalog";

import { Clarity } from "./clarity";
import { Prestige } from "./prestige";
import { Luxe } from "./luxe";
import { Vivid } from "./vivid";
import { Editorial } from "./editorial";
import { Studio } from "./studio";
import { Mission } from "./mission";
import { Foundation } from "./foundation";

// v2 catalog templates
import { ShopMate } from "./v2/ShopMate";
import { LunoraFashion } from "./v2/LunoraFashion";
import { MensClothes } from "./v2/MensClothes";
import { FashionHouse } from "./v2/FashionHouse";
import { Guza } from "./v2/Guza";
import { Inbio } from "./v2/Inbio";
import { RizwanAli } from "./v2/RizwanAli";
import { Spotlight } from "./v2/Spotlight";
import { Brandcraft } from "./v2/Brandcraft";
import { Handle } from "./v2/Handle";
import { Tailored } from "./v2/Tailored";
import { Overflow } from "./v2/Overflow";
import { Upskill } from "./v2/Upskill";
import { Motivac } from "./v2/Motivac";
import { OpenHeart } from "./v2/OpenHeart";
import { HelpingHands } from "./v2/HelpingHands";
import { Charius } from "./v2/Charius";
import { Fincco } from "./v2/Fincco";
import { ConferenceDark } from "./v2/ConferenceDark";
import { BellevueChurch } from "./v2/BellevueChurch";
import { DeedsChurch } from "./v2/DeedsChurch";
import { Leychert } from "./v2/Leychert";

export const TEMPLATE_REGISTRY: Record<string, ComponentType<TemplateProps>> = {
  clarity: Clarity,
  prestige: Prestige,
  luxe: Luxe,
  vivid: Vivid,
  editorial: Editorial,
  studio: Studio,
  mission: Mission,
  foundation: Foundation,
};

type V2Component = ComponentType<{ siteData: SiteData; brandColor: string }>;

/** v2 catalog templates, keyed by catalog template id. */
export const V2_REGISTRY: Record<string, V2Component> = {
  "shop-01": ShopMate,
  "shop-02": LunoraFashion,
  "shop-03": MensClothes,
  "shop-04": FashionHouse,
  "shop-05": Guza,
  "portfolio-01": Inbio,
  "portfolio-02": RizwanAli,
  "portfolio-03": Spotlight,
  "portfolio-04": Brandcraft,
  "portfolio-05": Handle,
  "portfolio-06": Tailored,
  "portfolio-07": Overflow,
  "education-01": Upskill,
  "education-02": Motivac,
  "org-01": OpenHeart,
  "org-04": HelpingHands,
  "org-02": Charius,
  "org-03": Fincco,
  "events-01": ConferenceDark,
  "events-02": BellevueChurch,
  "events-03": DeedsChurch,
  "events-04": Leychert,
};

function toCatalogProducts(products?: Product[]): CatalogProduct[] | undefined {
  if (!products?.length) return undefined;
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    price: p.price,
    comparePrice: p.compare_price ?? undefined,
    image: p.images?.[0] || "",
    category: p.category || undefined,
    bestSeller: p.is_best_seller,
    offer: p.is_offer,
    newArrival: p.is_new_arrival,
    offerPercent: p.offer_percent,
    colors: p.colors || [],
    colorVariants: p.color_variants || [],
  }));
}

/**
 * Renders the correct template for a site, wiring inline-edit and storefront
 * contexts. Handles both the original templates and the v2 catalog templates.
 */
export function SiteRenderer({
  templateId,
  siteData,
  brandColor,
  products,
  editApi,
  storeApi,
  siteId,
}: {
  templateId: string;
  siteData: SiteData;
  brandColor: string;
  products?: Product[];
  editApi?: TemplateEditApi;
  storeApi?: StoreApi;
  /** When set (published site), forms submit leads to this site. */
  siteId?: string;
}) {
  const V2 = V2_REGISTRY[templateId];
  const Legacy = TEMPLATE_REGISTRY[templateId];

  // For v2 stores, feed live DB products into the template's content.
  const liveProducts = toCatalogProducts(products);
  let v2Data: SiteData =
    V2 && liveProducts ? { ...siteData, products: liveProducts } : siteData;

  // On the live site (not in the editor), hide untouched placeholder reviews so a
  // store never shows fake testimonials the owner didn't write.
  if (!editApi?.editing && v2Data.testimonials?.length) {
    const real = v2Data.testimonials.filter((t) => !isDemoReview(t));
    if (real.length !== v2Data.testimonials.length) v2Data = { ...v2Data, testimonials: real };
  }

  const storeValue: StoreApi = {
    ...(storeApi ?? { live: false, addToCart: () => {}, buyNow: () => {} }),
    siteId,
  };

  return (
    <TemplateEditContext.Provider value={editApi ?? { editing: false, update: () => {} }}>
      <StoreContext.Provider value={storeValue}>
        <DonationProvider
          siteId={siteId}
          enabled={!!v2Data.donationEnabled}
          goal={v2Data.donationGoal || 0}
          manual={v2Data.donationManual || 0}
        >
          {V2 ? (
            <V2 siteData={v2Data} brandColor={brandColor} />
          ) : (
            (() => {
              const Template = Legacy ?? Clarity;
              return <Template siteData={siteData} brandColor={brandColor} products={products} />;
            })()
          )}
        </DonationProvider>
      </StoreContext.Provider>
    </TemplateEditContext.Provider>
  );
}
