"use client";

import { ShoppingBag } from "lucide-react";
import { contrastText } from "@/lib/utils";
import { Editable } from "./editable";
import { ProductCard, ProductMedia, TemplateProps, blockContent, productsToShow } from "./shared";

export function Luxe({ siteData, brandColor, products }: TemplateProps) {
  const name = siteData.businessName || "Your Store";
  const hero = blockContent(siteData, "hero");
  const cta = blockContent(siteData, "cta");
  const items = productsToShow(products);
  const accent = "#111111";

  return (
    <div className="bg-white font-sans text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-semibold tracking-[0.2em] uppercase">{name}</span>
          <nav className="hidden gap-7 text-sm text-neutral-500 md:flex">
            <a href="#shop">Shop</a><a href="#shop">New In</a><a href="#shop">About</a>
          </nav>
          <button onClick={() => (document.getElementById("shop")?.scrollIntoView())} className="relative">
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Product hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">New Collection</p>
          <Editable as="h1" blockId="hero" field="headline" value={hero.headline || name}
            className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl" />
          <Editable as="p" blockId="hero" field="subheadline" value={hero.subheadline || ""}
            className="mt-4 max-w-sm text-neutral-500" />
          <a href="#shop" className="mt-7 inline-block bg-black px-7 py-3 text-sm font-medium text-white">
            {hero.ctaText || "Shop Now"}
          </a>
        </div>
        <div className="aspect-square overflow-hidden bg-neutral-100">
          <ProductMedia images={items[0]?.images} index={0} />
        </div>
      </section>

      {/* Category filter row */}
      <div id="shop" className="border-y border-neutral-200">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-4 text-sm">
          {["All", "New In", "Best Sellers", "Sale", "Accessories"].map((c, i) => (
            <span key={c} className={`whitespace-nowrap rounded-full px-4 py-1.5 ${i === 0 ? "bg-black text-white" : "bg-neutral-100 text-neutral-600"}`}>{c}</span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} accent={accent} buttonText="#ffffff" />
          ))}
        </div>
      </section>

      {/* Recommended carousel */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-xl font-semibold">Recommended for you</h2>
          <div className="mt-6 flex gap-5 overflow-x-auto pb-2">
            {items.slice(0, 5).map((p, i) => (
              <div key={p.id} className="w-44 shrink-0">
                <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
                  <ProductMedia images={p.images} index={i + 1} />
                </div>
                <p className="mt-2 line-clamp-1 text-sm font-medium">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark CTA band */}
      <section className="bg-black px-5 py-16 text-center text-white">
        <Editable as="h2" blockId="cta" field="headline" value={cta.headline || "Join the list"} className="text-3xl font-semibold" />
        <Editable as="p" blockId="cta" field="body" value={cta.body || ""} className="mx-auto mt-3 max-w-md text-white/60" />
        <button className="mt-6 px-7 py-3 text-sm font-medium" style={{ background: brandColor, color: contrastText(brandColor) }}>
          {cta.buttonText || "Shop the Collection"}
        </button>
      </section>

      <footer className="py-8 text-center text-sm text-neutral-400">{name} — Built with Tomora</footer>
    </div>
  );
}
