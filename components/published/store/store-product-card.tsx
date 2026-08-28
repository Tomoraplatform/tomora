"use client";

import Link from "next/link";
import { ShoppingCart, Zap } from "lucide-react";
import type { Product } from "@/lib/database.types";
import { formatNaira } from "@/lib/utils";
import { optimisedFallback, optimisedSrcSet } from "@/lib/image";
import { useStore } from "@/components/templates/store-context";

/**
 * Product tile for the home and category grids.
 *
 * The picture and name open the product's own page; the two buttons below are
 * shortcuts for shoppers who already know what they want. Buy goes straight to
 * checkout, the cart icon keeps them browsing.
 */
export function StoreProductCard({ product }: { product: Product }) {
  const store = useStore();
  return (
    <div className="group block">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={optimisedFallback(product.images[0])}
              {...(optimisedSrcSet(product.images[0])
                ? { srcSet: optimisedSrcSet(product.images[0]), sizes: "(max-width: 640px) 50vw, 300px" }
                : {})}
              alt={product.name} loading="lazy" decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          )}
          {product.is_pre_order && (
            <span className="absolute left-2 top-2 rounded-full bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Pre-order</span>
          )}
        </div>
        <p className="mt-3 line-clamp-1 text-sm font-medium uppercase tracking-wide text-black/80">{product.name}</p>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="font-semibold text-black">{formatNaira(product.price)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-black/40 line-through">{formatNaira(product.compare_price)}</span>
          )}
        </div>
      </Link>

      <div className="mt-2 flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => store.buyNow(product)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold"
          style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}
        >
          <Zap className="h-3.5 w-3.5" /> Buy
        </button>
        <button
          type="button"
          onClick={() => store.addToCart(product)}
          aria-label={`Add ${product.name} to cart`}
          title="Add to cart"
          className="flex w-10 shrink-0 items-center justify-center rounded-md border transition hover:bg-black/[0.04]"
          style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
