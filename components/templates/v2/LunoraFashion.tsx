"use client";

import { ArrowRight, PlayCircle, Truck, RotateCcw, ShieldCheck, Headphones, Instagram, Facebook } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, BrandButton, Img, ProductCardV2 } from "./shared";

export function LunoraFashion({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "LUNORA";
  const products = siteData.products || [];
  const cats = ["Women", "Men", "Dresses", "Tops", "Shoes", "Bags", "Accessories", "Sale"];
  const grid = ["Women's Collection", "Men's Collection", "Dresses", "Accessories"];

  return (
    <BrandStyle brandColor={brandColor} className="bg-[#FAF8F5] font-sans text-[#0A0A0A]">
      <header className="border-b border-black/5 bg-[#FAF8F5]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-sm font-semibold uppercase tracking-[0.2em]">{name} <span className="text-black/40">| Fashion</span></span>
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {["Home", "Shop", "Collections", "Lookbook", "Blog", "Contact"].map((l) => <a key={l} href="#">{l}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href="#" className="rounded-md border border-black/20 px-4 py-2 text-sm">Login</a>
            <BrandButton className="px-4 py-2">Register</BrandButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 lg:grid-cols-[55%_45%]">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-black/40">New Collection</span>
            <h1 className="mt-4 font-serif text-5xl font-bold leading-[1.05] sm:text-6xl">{siteData.heroHeadline}</h1>
            <p className="mt-5 max-w-md text-lg italic text-black/60">{siteData.heroSubtext}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <BrandButton as="a" href="#products">{siteData.ctaText || "Shop Now"} <ArrowRight className="h-4 w-4" /></BrandButton>
              <a href="#" className="flex items-center gap-2 text-sm font-medium"><PlayCircle className="h-5 w-5" /> Watch Lookbook</a>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
              {[[Truck, "Free Shipping"], [RotateCcw, "Easy Returns"], [ShieldCheck, "Secure Payment"]].map(([Icon, t]: any, i) => (
                <div key={i} className="flex items-center gap-2"><Icon className="h-5 w-5 text-black/50" /><span className="text-xs text-black/60">{t}</span></div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl"><Img src={siteData.heroImage} className="h-full w-full object-cover" /></div>
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2 text-xs text-black/50">
              {["01", "02", "03"].map((n, i) => <span key={n} className={i === 0 ? "font-bold text-black" : ""}>{n}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* Category circles */}
      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-5 py-6">
          {cats.map((c, i) => (
            <div key={c} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
              {c === "Sale" ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-xs font-bold text-white">SALE</div>
              ) : (
                <div className="h-16 w-16 overflow-hidden rounded-full bg-black/5"><Img src={`https://picsum.photos/seed/lun-cat${i}/120`} className="h-full w-full object-cover" /></div>
              )}
              <span className="text-xs text-black/60">{c}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category grid */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between">
          <div><span className="text-xs uppercase tracking-[0.3em] text-black/40">Shop by Category</span><h2 className="mt-2 font-serif text-3xl font-bold">Find Your Perfect Style</h2></div>
          <a href="#" className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>View All →</a>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {grid.map((g, i) => (
            <a key={g} href="#" className="group relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Img src={`https://picsum.photos/seed/lun-grid${i}/900/560`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-5 left-5 text-white"><p className="text-xl font-semibold">{g}</p><p className="text-sm">Explore Now →</p></div>
            </a>
          ))}
        </div>
      </section>

      {/* Promo double */}
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-14 md:grid-cols-2">
        {[["Limited Time Offer", "Spring Sale Up to 50% Off", "Shop The Sale →"], ["New Arrivals", "Fresh Styles Just Landed", "Explore New In →"]].map(([label, head, cta], i) => (
          <div key={i} className="flex items-center gap-4 overflow-hidden rounded-2xl bg-[#F3EFE9] p-6">
            <div className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-black/40">{label}</span>
              <h3 className="mt-2 font-serif text-2xl font-bold">{head}</h3>
              <a href="#products" className="mt-3 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>{cta}</a>
            </div>
            <div className="hidden h-28 w-28 shrink-0 overflow-hidden rounded-xl sm:block"><Img src={`https://picsum.photos/seed/lun-promo${i}/240`} className="h-full w-full object-cover" /></div>
          </div>
        ))}
      </section>

      {/* Best sellers */}
      <section id="products" className="mx-auto max-w-6xl px-5 pb-14">
        <div className="flex items-end justify-between">
          <div><span className="text-xs uppercase tracking-[0.3em] text-black/40">Best Sellers</span><h2 className="mt-2 font-serif text-3xl font-bold">Our Most Loved Picks</h2></div>
          <a href="#" className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>View All →</a>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {products.slice(0, 6).map((p) => <ProductCardV2 key={p.id} product={p} siteData={siteData} showButton={false} />)}
        </div>
      </section>

      {/* Newsletter split */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 md:grid-cols-2">
          <div className="aspect-[16/10] overflow-hidden rounded-2xl"><Img src="https://picsum.photos/seed/lun-news/900/560" className="h-full w-full object-cover" /></div>
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-black/40">Get 10% off your first order</span>
            <h2 className="mt-2 font-serif text-3xl font-bold">Join Our Style List</h2>
            <p className="mt-3 text-black/60">Be first to know about new arrivals, sales and style tips.</p>
            <div className="mt-5 flex gap-2"><input className="min-w-0 flex-1 rounded-md border border-black/15 px-4 py-3 text-sm" placeholder="Email address" /><BrandButton>Subscribe</BrandButton></div>
          </div>
        </div>
      </section>

      <footer className="bg-[#0A0A0A] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-lg font-semibold">{name}</p>
            <p className="mt-2 max-w-xs text-sm text-white/50">Curated fashion essentials for every day.</p>
            <div className="mt-4 flex gap-3 text-white/70"><Instagram className="h-5 w-5" /><Facebook className="h-5 w-5" /></div>
          </div>
          {[["Shop", ["All Products", "New Arrivals", "Women", "Men", "Sale"]], ["Customer Care", ["Shipping", "Returns", "FAQ", "Contact"]], ["About Us", ["Story", "Careers", "Press"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="text-sm font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-sm text-white/50">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
