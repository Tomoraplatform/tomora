"use client";

import { createContext, useContext } from "react";
import type { Product } from "@/lib/database.types";

export interface StoreApi {
  /** Whether storefront actions are wired (published site) vs preview. */
  live: boolean;
  addToCart: (product: Product) => void;
  buyNow: (product: Product) => void;
}

const defaultStore: StoreApi = {
  live: false,
  addToCart: () => {},
  buyNow: () => {},
};

export const StoreContext = createContext<StoreApi>(defaultStore);
export const useStore = () => useContext(StoreContext);
