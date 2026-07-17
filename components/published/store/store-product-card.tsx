import Link from "next/link";
import type { Product } from "@/lib/database.types";
import { formatNaira } from "@/lib/utils";

/** Product tile used on the home and category grids, links to the product's own page. */
export function StoreProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
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
  );
}
