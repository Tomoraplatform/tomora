"use client";

import { ShoppingCart, Shirt, Gift, Sparkles, Tag, Truck } from "lucide-react";
import { contrastText } from "@/lib/utils";
import { Editable } from "./editable";
import { ProductCard, ProductMedia, TemplateProps, blockContent, productsToShow } from "./shared";

export function Vivid({ siteData, brandColor, products }: TemplateProps) {
  const name = siteData.businessName || "Your Store";
  const onBrand = contrastText(brandColor);
  const hero = blockContent(siteData, "hero");
  const cta = blockContent(siteData, "cta");
  const items = productsToShow(products);
  const cats = [
    { icon: Shirt, label: "Apparel" },
    { icon: Gift, label: "Gifts" },
    { icon: Sparkles, label: "New" },
    { icon: Tag, label: "Deals" },
    { icon: Truck, label: "Fast Ship" },
  ];

  return (
    <div className="bg-white font-sans text-amber-950">
      <header className="sticky top-0 z-20 bg-[#fff7e6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-xl font-extrabold" style={{ color: brandColor }}>{name}</span>
          <nav className="hidden gap-6 text-sm font-medium text-amber-900/70 md:flex">
            <a href="#featured">Shop</a><a href="#new">New Arrivals</a><a href="#featured">Deals</a>
          </nav>
          <button className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>
            <ShoppingCart className="h-4 w-4" /> Cart
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#fff7e6]">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide" style={{ color: brandColor }}>
              Up to 40% off
            </span>
            <Editable as="h1" blockId="hero" field="headline" value={hero.headline || name}
              className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl" />
            <Editable as="p" blockId="hero" field="subheadline" value={hero.subheadline || ""}
              className="mt-4 max-w-sm text-lg text-amber-900/70" />
            <a href="#featured" className="mt-7 inline-block rounded-full px-7 py-3 text-sm font-bold" style={{ background: brandColor, color: onBrand }}>
              {hero.ctaText || "Shop Now"}
            </a>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-full opacity-30" style={{ background: brandColor }} />
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-xl">
              <ProductMedia images={items[0]?.images} index={2} />
            </div>
          </div>
        </div>
      </section>

      {/* Category icon row */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid grid-cols-5 gap-3">
          {cats.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-xl bg-[#fff7e6] p-4 text-center">
              <Icon className="h-6 w-6" style={{ color: brandColor }} />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured grid */}
      <section id="featured" className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="text-2xl font-extrabold">Featured Products</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} accent={brandColor} buttonText={onBrand} />
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section id="new" className="bg-[#fff7e6]">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-2xl font-extrabold">New Arrivals</h2>
          <div className="mt-6 flex gap-5 overflow-x-auto pb-2">
            {items.slice(0, 5).map((p, i) => (
              <div key={p.id} className="w-44 shrink-0 rounded-xl bg-white p-3 shadow-sm">
                <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
                  <ProductMedia images={p.images} index={i + 3} />
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-semibold">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo band */}
      <section className="px-5 py-14 text-center" style={{ background: brandColor, color: onBrand }}>
        <Editable as="h2" blockId="cta" field="headline" value={cta.headline || "Free delivery this week"} className="text-3xl font-extrabold" />
        <Editable as="p" blockId="cta" field="body" value={cta.body || ""} className="mx-auto mt-3 max-w-md opacity-90" />
        <button className="mt-6 rounded-full bg-white px-7 py-3 text-sm font-bold text-amber-950">{cta.buttonText || "Browse the Shop"}</button>
      </section>

      <footer className="py-8 text-center text-sm text-amber-900/50">{name} — Built with Tomora</footer>
    </div>
  );
}
