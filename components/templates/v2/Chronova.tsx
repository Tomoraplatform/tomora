"use client";

import { Search, Heart, ShoppingCart, ShieldCheck, RotateCcw, Truck } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, SocialIcons, BrandButton, ProductCardV2, Img,
  heading, subheading, navItems, productCategories, CustomSections, OrderedSections, formatNaira,
} from "./shared";
import { DonationSection } from "./DonationSection";
import { useStore } from "../store-context";
import { slugify } from "@/lib/utils";

/**
 * Chronova, watch/e-commerce storefront (light grey, white cards, pill nav).
 * Editor / onboarding preview version. The live site renders the real
 * multi-page store (home / shop / product / about / contact) with working
 * links; this single-page version keeps it editable like every catalog template.
 */
export function Chronova({ siteData, brandColor }: TemplateProps) {
  const store = useStore();
  const name = siteData.businessName || "Chronova";
  const products = siteData.products || [];
  const featured = products.find((p) => p.bestSeller) || products[0];
  const categories = siteData.shopCategories?.length
    ? siteData.shopCategories
    : productCategories(products).map((c, i) => ({ id: `c${i}`, name: c.name, image: c.image }));

  const linkProps = (href: string) => (store.live ? { href } : { href: undefined });

  const trust = [
    { icon: ShieldCheck, title: siteData.trustBadges?.[0]?.title || "100% Genuine", sub: siteData.trustBadges?.[0]?.subtitle || "Verified by our watchmakers" },
    { icon: RotateCcw, title: siteData.trustBadges?.[1]?.title || "30-Day Returns", sub: siteData.trustBadges?.[1]?.subtitle || "No-questions, easy swaps" },
    { icon: Truck, title: siteData.trustBadges?.[2]?.title || "Insured Delivery", sub: siteData.trustBadges?.[2]?.subtitle || "Tracked to your door" },
  ];

  const blocks: Record<string, React.ReactNode> = {
    donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
    hero: (
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2">
        <div>
          {(siteData.sectionEyebrows?.hero || "Fresh drops every week · Limited runs") && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs text-black/60 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-primary)" }} />
              {siteData.sectionEyebrows?.hero || "Fresh drops every week · Limited runs"}
            </span>
          )}
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl">{siteData.heroHeadline}</h1>
          {siteData.heroSubtext && <p className="mt-4 max-w-md text-neutral-500">{siteData.heroSubtext}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <BrandButton as="a" {...linkProps(siteData.ctaHref || "/shop")}>{siteData.ctaText || "Shop the Collection"}</BrandButton>
            <a {...linkProps("/shop")} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-neutral-900">
              {siteData.sectionButtons?.hero?.text || "Browse Best Sellers"}
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-7">
            {trust.map((t, i) => {
              const Icon = t.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 text-neutral-900" />
                  <div><p className="text-sm font-semibold text-neutral-900">{t.title}</p><p className="text-xs text-neutral-500">{t.sub}</p></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative flex min-h-[360px] items-center justify-center">
          <div className="absolute aspect-square w-[92%] max-w-md rounded-full" style={{ background: "radial-gradient(circle at 50% 40%, #fff, #e9e9e7)" }} />
          <div className="relative aspect-square w-[72%] max-w-xs overflow-hidden rounded-3xl shadow-2xl">
            <Img src={featured?.image || siteData.heroImage} className="h-full w-full object-cover" />
            {featured && (
              <div className="absolute bottom-4 right-4 rounded-2xl bg-white px-4 py-3 shadow-lg">
                <p className="text-[11px] text-neutral-500">{featured.name}</p>
                <p className="text-base font-bold text-neutral-900">{formatNaira(featured.price)}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    ),
    shop: (
      <section id="shop" className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-1">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{heading(siteData, "shop", "Explore the collection")}</h2>
          {subheading(siteData, "shop", "") && <p className="mt-1 text-sm text-neutral-500">{subheading(siteData, "shop", "")}</p>}
        </div>
        {categories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">All</span>
            {categories.slice(0, 5).map((c) => (
              <a key={c.id || c.name} {...linkProps(`/category/${slugify(c.name)}`)} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-500">{c.name}</a>
            ))}
          </div>
        )}
        {products.length === 0 ? (
          <p className="mt-8 text-sm text-neutral-500">Products you add in your dashboard will appear here.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {products.map((p) => <ProductCardV2 key={p.id} product={p} siteData={siteData} />)}
          </div>
        )}
      </section>
    ),
    categories: categories.length ? (
      <section id="categories" className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{heading(siteData, "categories", "Shop by style")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {categories.slice(0, 6).map((c) => (
            <a key={c.id || c.name} {...linkProps(`/category/${slugify(c.name)}`)} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl">
              <Img src={c.image} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/25" />
              <span className="absolute inset-x-4 bottom-4 text-base font-bold text-white">{c.name}</span>
            </a>
          ))}
        </div>
      </section>
    ) : null,
    featured: featured ? (
      <section id="featured" className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{heading(siteData, "featured", "This week's pick")}</h2>
        <div className="mt-6 max-w-xs"><ProductCardV2 product={featured} siteData={siteData} /></div>
      </section>
    ) : null,
    newsletter: (
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="rounded-3xl bg-white px-6 py-14 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{siteData.sectionEyebrows?.newsletter || "Stay in the loop"}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{heading(siteData, "newsletter", "Join the Collectors' List")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{subheading(siteData, "newsletter", "Be first to hear about new arrivals, private drops and member-only pricing.")}</p>
          <div className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-2">
            <input className="min-w-[200px] flex-1 rounded-full border border-black/10 bg-[#F3F3F2] px-5 py-3 text-sm outline-none" placeholder="Enter your email" />
            <BrandButton>Subscribe</BrandButton>
          </div>
        </div>
      </section>
    ),
  };

  const nav = navItems(siteData, [["Home", "/"], ["Shop", "/shop"], ["About", "/about"], ["Contact", "/contact"]]);

  return (
    <BrandStyle brandColor={brandColor} className="bg-[#F3F3F2] font-sans text-neutral-900">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-[#F3F3F2]/90 px-5 py-4 backdrop-blur">
        <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
        <nav className="hidden items-center gap-1 rounded-full bg-white p-1.5 shadow-sm md:flex">
          {nav.map(([l, h]) => <a key={l} {...linkProps(h)} className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-[#F3F3F2] hover:text-neutral-900">{l}</a>)}
        </nav>
        <div className="flex items-center gap-2 text-neutral-900">
          {[Search, Heart, ShoppingCart].map((Ic, i) => (
            <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"><Ic className="h-[18px] w-[18px]" /></span>
          ))}
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "shop", "categories", "featured", "newsletter", "donation"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="mx-auto max-w-6xl px-5 pb-10">
        <div className="rounded-3xl bg-white px-8 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Brandmark siteData={siteData} name={name} className="text-xl font-bold" />
              <p className="mt-3 max-w-[240px] text-sm text-neutral-500">{siteData.tagline || "Curated timepieces for the everyday collector."}</p>
              <SocialIcons social={siteData.social} className="mt-4 text-neutral-500" />
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Shop</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
                {categories.slice(0, 5).map((c) => <li key={c.id || c.name}><a {...linkProps(`/category/${slugify(c.name)}`)}>{c.name}</a></li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Support</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
                {["Contact", "FAQs", "Shipping", "Returns", "Warranty"].map((l) => <li key={l}><a {...linkProps(l === "Contact" ? "/contact" : "#")}>{l}</a></li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Get in touch</h4>
              <div className="mt-4 space-y-1.5 text-sm text-neutral-500">
                {siteData.address && <p>{siteData.address}</p>}
                {siteData.phone && <p>{siteData.phone}</p>}
                {siteData.email && <p>{siteData.email}</p>}
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-black/5 pt-6 text-center text-xs text-neutral-400">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
        </div>
      </footer>
    </BrandStyle>
  );
}
