"use client";

import type { ComponentType } from "react";
import type { Product, SiteData } from "@/lib/database.types";
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

/**
 * Renders the correct template for a site, wiring inline-edit and storefront
 * contexts. Used by the editor preview and the published subdomain.
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
  const Template = TEMPLATE_REGISTRY[templateId] ?? Clarity;

  return (
    <TemplateEditContext.Provider value={editApi ?? { editing: false, update: () => {} }}>
      <StoreContext.Provider value={storeApi ?? { live: false, addToCart: () => {}, buyNow: () => {} }}>
        <Template siteData={siteData} brandColor={brandColor} products={products} />
      </StoreContext.Provider>
    </TemplateEditContext.Provider>
  );
}
