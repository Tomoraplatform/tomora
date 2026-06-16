"use client";

import { ShoppingCart, Zap } from "lucide-react";
import type { Product, SiteData } from "@/lib/database.types";
import { formatNaira } from "@/lib/utils";
import { useStore } from "./store-context";

export interface TemplateProps {
  siteData: SiteData;
  brandColor: string;
  products?: Product[];
}

/** Demo products used when a storefront has none yet (preview only). */
export const DEMO_PRODUCTS: Pick<Product, "id" | "name" | "price" | "images">[] = [
  { id: "demo-1", name: "Signature Piece", price: 18000, images: [] },
  { id: "demo-2", name: "Everyday Essential", price: 9500, images: [] },
  { id: "demo-3", name: "Limited Edition", price: 32000, images: [] },
  { id: "demo-4", name: "Classic Staple", price: 12500, images: [] },
  { id: "demo-5", name: "Premium Select", price: 27000, images: [] },
  { id: "demo-6", name: "Best Seller", price: 15000, images: [] },
];

const PLACEHOLDER_TINTS = [
  "#e7ddcf", "#cdd9e5", "#e3d6e8", "#d8e8d6", "#f0dcd2", "#dde0ec",
];

export function ProductMedia({ images, index = 0 }: { images?: string[]; index?: number }) {
  const src = images?.[0];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="h-full w-full object-cover" />;
  }
  return (
    <div
      className="h-full w-full"
      style={{ background: PLACEHOLDER_TINTS[index % PLACEHOLDER_TINTS.length] }}
    />
  );
}

/**
 * Storefront product card with Add to Cart / Buy Now. Works in preview
 * (no-op) and on live published sites via StoreContext.
 */
export function ProductCard({
  product,
  index,
  accent,
  buttonText = "#ffffff",
}: {
  product: Product;
  index: number;
  accent: string;
  buttonText?: string;
}) {
  const store = useStore();
  return (
    <div className="group overflow-hidden rounded-lg border border-black/10 bg-white">
      <div className="aspect-square overflow-hidden">
        <ProductMedia images={product.images} index={index} />
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-medium">{product.name}</h3>
          <p className="text-sm font-semibold" style={{ color: accent }}>
            {formatNaira(product.price)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => store.addToCart(product)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-black/15 px-3 py-2 text-xs font-medium transition-colors hover:bg-black/5"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </button>
          <button
            onClick={() => store.buyNow(product)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium"
            style={{ background: accent, color: buttonText }}
          >
            <Zap className="h-3.5 w-3.5" /> Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

export function productsToShow(products?: Product[]): Product[] {
  if (products && products.length) return products;
  return DEMO_PRODUCTS as unknown as Product[];
}

/** Simple contact form used by several templates. */
export function ContactForm({ accent, buttonText = "#ffffff" }: { accent: string; buttonText?: string }) {
  return (
    <form
      className="mx-auto grid max-w-xl gap-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <input className="rounded-md border border-black/15 px-4 py-3 text-sm" placeholder="Your name" />
        <input className="rounded-md border border-black/15 px-4 py-3 text-sm" placeholder="Your email" />
      </div>
      <input className="rounded-md border border-black/15 px-4 py-3 text-sm" placeholder="Phone (optional)" />
      <textarea rows={4} className="rounded-md border border-black/15 px-4 py-3 text-sm" placeholder="How can we help?" />
      <button
        type="submit"
        className="rounded-md px-6 py-3 text-sm font-semibold"
        style={{ background: accent, color: buttonText }}
      >
        Send Message
      </button>
    </form>
  );
}

export function blockContent(siteData: SiteData, type: string): Record<string, any> {
  return siteData.blocks?.find((b) => b.type === type && b.enabled)?.content ?? {};
}

export function hasBlock(siteData: SiteData, type: string): boolean {
  return !!siteData.blocks?.find((b) => b.type === type && b.enabled);
}
