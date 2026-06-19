"use client";

import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones, Quote, ShoppingCart } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, testimonialsOf, BrandButton, OutlineButton, ProductCardV2, Img } from "./shared";

const TINTS = ["#dbeafe", "#fce7f3", "#fef9c3", "#ede9fe", "#ccfbf1", "#ffedd5"];

export function ShopMate({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "ShopMate";
  const products = siteData.products || [];
  const trust = [
    { icon: Truck, t: "Free Shipping", s: "On orders over ₦20,000" },
    { icon: ShieldCheck, t: "Secure Payment", s: "100% secure payment" },
    { icon: RotateCcw, t: "Easy Returns", s: "30 days return policy" },
    { icon: Headphones, t: "24/7 Support", s: "Dedicated support" },
  ];
  const cats = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Accessories"];

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-xl font-bold" />
          <nav className="hidden gap-7 text-sm text-black/60 md:flex">
            <a href="#categories">Categories</a><a href="#products">Shop</a><a href="#offer">Deals</a>
          </nav>
          <button className="relative" aria-label="Cart"><ShoppingCart className="h-5 w-5" /></button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#FBFAF7]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}>NEW ARRIVALS</span>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">{siteData.heroHeadline}</h1>
            <p className="mt-4 max-w-md text-black/60">{siteData.heroSubtext}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <BrandButton as="a" href="#products">{siteData.ctaText || "Shop Now"} <ArrowRight className="h-4 w-4" /></BrandButton>
              <OutlineButton href="#offer">Explore Deals</OutlineButton>
            </div>
            <div className="mt-7 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[0,1,2,3].map((i) => <Img key={i} src={`https://picsum.photos/seed/face${i}/64`} className="h-9 w-9 rounded-full border-2 border-white object-cover" />)}
              </div>
              <span className="text-sm text-black/50">Trusted by 10,000+ Happy Customers</span>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-3xl bg-white shadow-xl">
              <Img src={siteData.heroImage} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-black/5">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <Icon className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
              <div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-black/50">{s}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Shop by Categories</h2>
          <a href="#products" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--brand-primary)" }}>View All <ArrowRight className="h-4 w-4" /></a>
        </div>
        <div className="mt-8 flex gap-6 overflow-x-auto pb-2">
          {cats.map((c, i) => (
            <div key={c} className="flex w-24 shrink-0 flex-col items-center gap-2 text-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full" style={{ background: TINTS[i % TINTS.length] }}>
                <Img src={`https://picsum.photos/seed/cat${i}/120`} className="h-12 w-12 rounded-full object-cover" />
              </div>
              <span className="text-xs font-medium text-black/70">{c}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Best selling */}
      <section id="products" className="bg-[#FBFAF7]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold">Best Selling Products</h2>
            <a href="#products" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--brand-primary)" }}>View All <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {products.slice(0, 5).map((p) => <ProductCardV2 key={p.id} product={p} siteData={siteData} />)}
          </div>
        </div>
      </section>

      {/* Special offer */}
      <section id="offer" className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-[#F3EFE6] p-8 md:grid-cols-2 md:p-12">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Special Offer</span>
            <h2 className="mt-2 font-serif text-4xl font-bold">Up to 50% Off</h2>
            <p className="mt-3 max-w-sm text-black/60">Limited time savings across our best-selling categories. Don&apos;t miss out.</p>
            <BrandButton as="a" href="#products" className="mt-6">Shop the Sale <ArrowRight className="h-4 w-4" /></BrandButton>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl"><Img src="https://picsum.photos/seed/shopmate-offer/800/600" className="h-full w-full object-cover" /></div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#FBFAF7]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-center text-2xl font-bold">What Our Customers Say</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonialsOf(siteData).map((t, i) => (
              <figure key={t.id || i} className="rounded-2xl bg-white p-6 shadow-sm">
                <Quote className="h-7 w-7" style={{ color: "var(--brand-primary)" }} />
                <blockquote className="mt-3 text-sm text-black/70">{t.quote}</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <Img src={`https://picsum.photos/seed/rev${i}/64`} className="h-10 w-10 rounded-full object-cover" />
                  <span className="text-sm font-semibold">{t.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <ShopFooter name={name} />
    </BrandStyle>
  );
}

function ShopFooter({ name }: { name: string }) {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-lg font-bold">{name}</p><p className="mt-2 text-sm text-black/50">Quality products delivered to your door, with secure Paystack checkout.</p></div>
        <div><h4 className="text-sm font-semibold">Quick Links</h4><ul className="mt-3 space-y-2 text-sm text-black/50"><li>Home</li><li>Shop</li><li>Deals</li><li>About</li></ul></div>
        <div><h4 className="text-sm font-semibold">Customer Service</h4><ul className="mt-3 space-y-2 text-sm text-black/50"><li>Shipping</li><li>Returns</li><li>FAQ</li><li>Contact</li></ul></div>
        <div><h4 className="text-sm font-semibold">Newsletter</h4>
          <div className="mt-3 flex gap-2"><input className="min-w-0 flex-1 rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Email" /><BrandButton className="px-4 py-2">Join</BrandButton></div>
        </div>
      </div>
      <div className="border-t border-black/5 py-5 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
    </footer>
  );
}
