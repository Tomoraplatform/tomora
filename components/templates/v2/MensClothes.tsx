"use client";

import { Search, ShoppingCart, ArrowRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, Img, formatNaira } from "./shared";
import { useStore } from "../store-context";
import type { CatalogProduct, Product, SiteData } from "@/lib/database.types";

const TABS = ["Tops", "Sweaters", "Jeans", "Coats & Jackets", "Activewear", "Shorts", "Pants"];

function Card({ product, siteData }: { product: CatalogProduct; siteData: SiteData }) {
  const store = useStore();
  const add = () => store.addToCart({ id: product.id, name: product.name, price: product.price, images: product.image ? [product.image] : [], stock: 99, is_active: true } as Product);
  return (
    <div className="group">
      <div className="aspect-[3/4] overflow-hidden bg-neutral-100"><Img src={product.image} className="h-full w-full object-cover transition-transform group-hover:scale-105" /></div>
      <p className="mt-3 line-clamp-1 text-sm text-neutral-700">{product.name}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-semibold">{formatNaira(product.price)}</span>
        {product.comparePrice && <span className="text-sm text-neutral-400 line-through">{formatNaira(product.comparePrice)}</span>}
      </div>
      <button onClick={add} className="mt-2 w-full rounded py-2 text-sm font-semibold text-white" style={{ background: "var(--brand-primary)" }}>Add to cart</button>
    </div>
  );
}

export function MensClothes({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Men's Clothes";
  const products = siteData.products || [];

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      {/* Top navbar */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
          <div>
            <Brandmark siteData={siteData} name={name} className="text-lg font-bold leading-none" />
            <p className="text-[10px] text-neutral-400">The biggest choice on the web</p>
          </div>
          <div className="relative ml-auto hidden flex-1 max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input className="w-full rounded-md border border-neutral-200 py-2 pl-9 pr-3 text-sm" placeholder="Search products" />
          </div>
          <button className="relative ml-auto md:ml-0" aria-label="Cart">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--brand-primary)" }}>0</span>
          </button>
        </div>
        <div className="border-t border-neutral-100">
          <div className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-5 py-2.5 text-sm text-neutral-600">
            {TABS.map((t) => <a key={t} href="#" className="whitespace-nowrap hover:text-black">{t}</a>)}
          </div>
        </div>
      </header>

      {/* Hero banner trio */}
      <section className="mx-auto grid max-w-6xl gap-3 px-5 py-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-lg md:col-span-2 md:row-span-2">
          <Img src={siteData.heroImage} className="h-full min-h-[320px] w-full object-cover" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="max-w-sm text-3xl font-bold uppercase leading-tight">{siteData.heroHeadline}</h1>
            <a href="#new" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">Shop now <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
        {[["New Arrivals", "Fresh drops for the season"], ["Big Clearance", "Up to 60% off select styles"]].map(([t, s], i) => (
          <div key={i} className="relative overflow-hidden rounded-lg">
            <Img src={`https://picsum.photos/seed/men-banner${i}/600/300`} className="h-40 w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-4 left-4 text-white"><p className="text-lg font-bold uppercase">{t}</p><p className="text-xs text-white/80">{s}</p></div>
          </div>
        ))}
      </section>

      {/* New products */}
      <section id="new" className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-xl font-bold">New products</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => <Card key={p.id} product={p} siteData={siteData} />)}
        </div>
      </section>

      {/* Special products */}
      <section className="bg-neutral-50">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <h2 className="text-xl font-bold">Special products</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {products.map((p) => <Card key={p.id} product={{ ...p, comparePrice: p.comparePrice || Math.round(p.price * 1.3) }} siteData={siteData} />)}
          </div>
        </div>
      </section>

      {/* Category banner trio */}
      <section className="mx-auto grid max-w-6xl gap-3 px-5 py-10 md:grid-cols-3">
        {["Coats & Jackets", "Sports Jackets", "Suits & Blazers"].map((t, i) => (
          <div key={t} className="relative overflow-hidden rounded-lg">
            <Img src={`https://picsum.photos/seed/men-cat${i}/600/400`} className="h-56 w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-5 left-5 text-white"><p className="text-lg font-bold uppercase">{t}</p><p className="text-xs text-white/80">Explore the collection</p></div>
          </div>
        ))}
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          {[["Information", ["About Us", "Customer Service", "Site Map", "Advanced Search", "Orders and Returns"]], ["Why buy from us", ["Quality", "Fast Delivery", "Secure Payment"]], ["My account", ["Sign In", "Wish List", "My Orders", "Track Order", "Newsletter"]], ["Contacts", ["12 Marina Rd, Lagos", "+234 800 000 0000", "hello@store.com"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-neutral-500">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="border-t border-neutral-100 py-5 text-center text-sm text-neutral-400">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
