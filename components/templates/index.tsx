"use client";

import type { ComponentType } from "react";
import type { Product, SiteData, CatalogProduct } from "@/lib/database.types";
import { TemplateEditContext, type TemplateEditApi } from "./editor-context";
import { StoreContext, type StoreApi } from "./store-context";
import type { TemplateProps } from "./shared";

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
import { Inbio } from "./v2/Inbio";
import { RizwanAli } from "./v2/RizwanAli";
import { Upskill } from "./v2/Upskill";
import { Motivac } from "./v2/Motivac";
import { OpenHeart } from "./v2/OpenHeart";
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
  "portfolio-01": Inbio,
  "portfolio-02": RizwanAli,
  "education-01": Upskill,
  "education-02": Motivac,
  "org-01": OpenHeart,
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
    price: p.price,
    image: p.images?.[0] || "",
    category: p.category || undefined,
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
}: {
  templateId: string;
  siteData: SiteData;
  brandColor: string;
  products?: Product[];
  editApi?: TemplateEditApi;
  storeApi?: StoreApi;
}) {
  const V2 = V2_REGISTRY[templateId];
  const Legacy = TEMPLATE_REGISTRY[templateId];

  // For v2 stores, feed live DB products into the template's content.
  const liveProducts = toCatalogProducts(products);
  const v2Data: SiteData =
    V2 && liveProducts ? { ...siteData, products: liveProducts } : siteData;

  return (
    <TemplateEditContext.Provider value={editApi ?? { editing: false, update: () => {} }}>
      <StoreContext.Provider value={storeApi ?? { live: false, addToCart: () => {}, buyNow: () => {} }}>
        {V2 ? (
          <V2 siteData={v2Data} brandColor={brandColor} />
        ) : (
          (() => {
            const Template = Legacy ?? Clarity;
            return <Template siteData={siteData} brandColor={brandColor} products={products} />;
          })()
        )}
      </StoreContext.Provider>
    </TemplateEditContext.Provider>
  );
}
