"use client";

import { createContext, useContext } from "react";
import type { Product } from "@/lib/database.types";

export interface StoreApi {
  /** Whether storefront actions are wired (published site) vs preview. */
  live: boolean;
  addToCart: (product: Product) => void;
  buyNow: (product: Product) => void;
  /** Open the product detail view (description + colour variants that swap the image). */
  openProduct?: (product: Product) => void;
  /** Open the cart drawer. Lets a template own its cart button, e.g. a
   *  restaurant's bottom tab bar, instead of relying on a floating one. */
  openCart?: () => void;
  /** Set on a published site so forms can submit leads; undefined in preview. */
  siteId?: string;
  /** True only on the real published tenant host, where /category and /product routes resolve. */
  tenantHost?: boolean;
}

const defaultStore: StoreApi = {
  live: false,
  addToCart: () => {},
  buyNow: () => {},
};

export const StoreContext = createContext<StoreApi>(defaultStore);
export const useStore = () => useContext(StoreContext);
