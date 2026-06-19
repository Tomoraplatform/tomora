"use client";

import { Star, ShoppingCart, Zap, Instagram, Twitter, Facebook, Globe } from "lucide-react";
import type { SiteData, CatalogProduct, CatalogTestimonial, Product, SocialLinks } from "@/lib/database.types";
import { formatNaira, cn } from "@/lib/utils";
import { useStore } from "../store-context";

export interface TemplateProps {
  siteData: SiteData;
  brandColor: string;
}

/** Renders the uploaded logo if present, otherwise the business name text. */
export function Brandmark({
  siteData,
  name,
  className,
}: {
  siteData: SiteData;
  name: string;
  className?: string;
}) {
  if (siteData.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={siteData.logoUrl} alt={name} className="h-9 w-auto max-w-[170px] object-contain" />;
  }
  return <span className={className}>{name}</span>;
}

/** Brand-colored solid button. */
export function BrandButton({
  children, className = "", as = "button", href, onClick,
}: {
  children: React.ReactNode; className?: string;
  as?: "button" | "a"; href?: string; onClick?: () => void;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${className}`;
  const style = { background: "var(--brand-primary)", color: "var(--brand-on-primary)" } as React.CSSProperties;
  if (as === "a") return <a href={href} className={cls} style={style} onClick={onClick}>{children}</a>;
  return <button className={cls} style={style} onClick={onClick}>{children}</button>;
}

export function OutlineButton({ children, className = "", href }: { children: React.ReactNode; className?: string; href?: string }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm font-semibold ${className}`;
  return <a href={href || "#"} className={cls}>{children}</a>;
}

export function StarRow({ rating = 5, count }: { rating?: number; count?: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="flex" style={{ color: "var(--brand-primary)" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-4 w-4" fill={i < Math.round(rating) ? "currentColor" : "none"} />
        ))}
      </span>
      {count != null && <span className="text-black/40">({count})</span>}
    </div>
  );
}

export function Img({ src, alt = "", className = "" }: { src?: string; alt?: string; className?: string }) {
  if (!src) return <div className={`bg-black/10 ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={className} />;
}

/** Maps a catalog product into the cart Product shape and fires store actions. */
function toProduct(p: CatalogProduct, siteData: SiteData): Product {
  return {
    id: p.id, user_id: "", site_id: "", name: p.name, description: null,
    price: p.price, images: p.image ? [p.image] : [], category: p.category || null,
    stock: 99, is_active: true, created_at: "",
  } as Product;
}

export function ProductCardV2({
  product, siteData, showButton = true,
}: {
  product: CatalogProduct; siteData: SiteData; showButton?: boolean;
}) {
  const store = useStore();
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className="aspect-square overflow-hidden bg-black/5">
        <Img src={product.image} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-medium text-black/90">{product.name}</h3>
        {product.rating != null && <StarRow rating={product.rating} count={product.reviews} />}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black/90">{formatNaira(product.price)}</span>
          {product.comparePrice && <span className="text-sm text-black/40 line-through">{formatNaira(product.comparePrice)}</span>}
        </div>
        {showButton && (
          <button
            onClick={() => store.addToCart(toProduct(product, siteData))}
            className="mt-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold"
            style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}
          >
            <ShoppingCart className="h-4 w-4" /> Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductCardSplit({ product, siteData }: { product: CatalogProduct; siteData: SiteData }) {
  const store = useStore();
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white p-3">
      <div className="aspect-square overflow-hidden rounded-md bg-black/5">
        <Img src={product.image} className="h-full w-full object-cover" />
      </div>
      <h3 className="mt-3 line-clamp-1 text-sm text-black/80">{product.name}</h3>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-semibold">{formatNaira(product.price)}</span>
        <button onClick={() => store.addToCart(toProduct(product, siteData))} className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>
          Add to cart
        </button>
      </div>
    </div>
  );
}

export function ContactFormV2({ submitText = "Send Message", phone = true }: { submitText?: string; phone?: boolean }) {
  return (
    <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input className="rounded-md border border-black/15 bg-white px-4 py-3 text-sm" placeholder="Your name" />
        <input className="rounded-md border border-black/15 bg-white px-4 py-3 text-sm" placeholder="Your email" />
      </div>
      {phone && <input className="rounded-md border border-black/15 bg-white px-4 py-3 text-sm" placeholder="Phone (optional)" />}
      <textarea rows={4} className="rounded-md border border-black/15 bg-white px-4 py-3 text-sm" placeholder="Your message" />
      <BrandButton>{submitText}</BrandButton>
    </form>
  );
}

export function NewsletterInput({ buttonText = "Subscribe", dark = false }: { buttonText?: string; dark?: boolean }) {
  return (
    <div className="flex w-full max-w-md gap-2">
      <input
        className={`flex-1 rounded-md px-4 py-3 text-sm outline-none ${dark ? "border border-white/20 bg-white/10 text-white placeholder:text-white/50" : "border border-black/15 bg-white"}`}
        placeholder="Enter your email"
      />
      <BrandButton>{buttonText}</BrandButton>
    </div>
  );
}

export { formatNaira, Zap };

/** Editable testimonials, with a fallback so an un-edited site still looks full. */
export function testimonialsOf(siteData: SiteData): CatalogTestimonial[] {
  return siteData.testimonials?.length ? siteData.testimonials : [];
}

/** Editable services/features. Falls back to the template's built-in defaults. */
export function servicesOf(
  siteData: SiteData,
  fallback: { title: string; description?: string }[]
): { title: string; description?: string }[] {
  return siteData.services?.length ? siteData.services : fallback;
}

function normalizeUrl(url: string, base: string): string {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url;
  if (base) return base + url.replace(/^@/, "");
  return `https://${url}`;
}

/** Renders social icons for whichever links the user provided (editable). */
export function SocialIcons({ social, className = "" }: { social?: SocialLinks; className?: string }) {
  const items = [
    { url: social?.instagram, Icon: Instagram, base: "https://instagram.com/" },
    { url: social?.twitter, Icon: Twitter, base: "https://twitter.com/" },
    { url: social?.facebook, Icon: Facebook, base: "https://facebook.com/" },
    { url: social?.website, Icon: Globe, base: "" },
  ].filter((i) => i.url);
  if (!items.length) return null;
  return (
    <div className={cn("flex gap-3", className)}>
      {items.map(({ url, Icon, base }, i) => (
        <a key={i} href={normalizeUrl(url as string, base)} target="_blank" rel="noreferrer" className="opacity-70 transition-opacity hover:opacity-100">
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  );
}
