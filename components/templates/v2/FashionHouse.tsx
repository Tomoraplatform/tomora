"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingCart, Heart, Truck, ShieldCheck, RotateCcw, Headphones, Star, ArrowUpRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, SocialIcons, BrandButton, ProductCardV2, Img,
  heading, subheading, navItems, testimonialsOf, CustomSections, OrderedSections,
} from "./shared";
import { DonationSection } from "./DonationSection";
import { useTemplateEdit } from "../editor-context";
import type { CatalogProduct, SiteData } from "@/lib/database.types";

const TRUST_ICONS = [Truck, RotateCcw, ShieldCheck, Headphones];
const slug = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Product grid with category tabs derived from the products themselves. */
function ProductTabs({ products, siteData }: { products: CatalogProduct[]; siteData: SiteData }) {
  const cats = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) { const c = (p.category || "").trim(); if (c && !seen.includes(c)) seen.push(c); }
    return seen;
  }, [products]);
  const tabs = cats.length > 1 ? cats : [];
  const [tab, setTab] = useState<string>("");
  const active = tab || tabs[0] || "";
  const shown = active ? products.filter((p) => slug(p.category || "") === slug(active)) : products;

  return (
    <>
      {tabs.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-5 text-sm font-medium">
          {tabs.map((c) => (
            <button key={c} onClick={() => setTab(c)}
              className={active === c ? "border-b-2 pb-0.5" : "text-black/50 hover:text-black"}
              style={active === c ? { color: "var(--brand-primary)", borderColor: "var(--brand-primary)" } : undefined}>
              {c}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="mt-8 text-center text-sm text-black/50">Products you add in your dashboard appear here.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => <ProductCardV2 key={p.id} product={p} siteData={siteData} />)}
        </div>
      )}
    </>
  );
}

export function FashionHouse({ siteData, brandColor }: TemplateProps) {
  const { editing } = useTemplateEdit();
  const name = siteData.businessName || "Fashion House";
  const products = siteData.products || [];
  const badges = siteData.trustBadges?.length ? siteData.trustBadges : [
    { id: "1", title: "Free Shipping", subtitle: "From all orders over $100" },
    { id: "2", title: "Free Returns", subtitle: "Return money within 30 days" },
    { id: "3", title: "Secure Shopping", subtitle: "You're in safe hands" },
    { id: "4", title: "Over 10,000 Styles", subtitle: "We have everything you need" },
  ];
  const cards = siteData.shopCategories || [];
  const offers = products.filter((p) => p.offer);
  const bestSellers = products.filter((p) => p.bestSeller);
  const posts = siteData.blogPosts || [];
  const heroLines = (siteData.heroHeadline || "Explosive\nBig Sale").split("\n");

  const blocks: Record<string, React.ReactNode> = {
    donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
    banner: siteData.sectionImages?.banner ? (
      <section className="mx-auto max-w-6xl px-5 py-6"><Img src={siteData.sectionImages.banner} className="w-full rounded-2xl object-cover" /></section>
    ) : null,
    hero: (
      <section className="bg-[#F4F5F7]">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 sm:py-16 lg:grid-cols-2">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <h1 className="text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl">
              {heroLines[0]}
              {heroLines[1] ? <span className="mt-1 block font-serif text-4xl font-medium normal-case italic sm:text-5xl" style={{ color: "var(--brand-primary)" }}>{heroLines[1]}</span> : null}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm text-black/55 lg:mx-0">{siteData.heroSubtext}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 lg:justify-start">
              <BrandButton as="a" href={siteData.ctaHref || "#deals"}>{siteData.ctaText || "Buy Now"}</BrandButton>
              {(siteData.heroStatValue || editing) ? (
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-md">
                  <span className="text-[10px] font-semibold uppercase leading-tight text-black/60">{siteData.heroStatLabel || "Save up to"}</span>
                  <span className="text-2xl font-extrabold" style={{ color: "var(--brand-primary)" }}>{siteData.heroStatValue || "50%"}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="relative order-1 mx-auto lg:order-2">
            <div className="absolute left-1/2 top-1/2 -z-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-72 sm:w-72" style={{ background: "var(--brand-primary)" }} />
            <Img src={siteData.heroImage} className="relative z-10 mx-auto aspect-[3/4] w-64 object-contain sm:w-80" />
          </div>
        </div>
      </section>
    ),
    trust: (
      <section className="border-y border-black/5 bg-[#FAFAFA]">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <div key={b.id || i} className="flex items-center gap-3">
                <Icon className="h-6 w-6 shrink-0" style={{ color: "var(--brand-primary)" }} />
                <div><p className="text-sm font-semibold">{b.title}</p>{b.subtitle ? <p className="text-xs text-black/50">{b.subtitle}</p> : null}</div>
              </div>
            );
          })}
        </div>
      </section>
    ),
    categories: cards.length === 0 ? null : (
      <section id="categories" className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.id} className="group relative overflow-hidden rounded-2xl">
              <Img src={c.image} className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent p-5">
                <a href="#deals" className="rounded-md px-5 py-2 text-sm font-semibold" style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}>{c.name || "Shop"}</a>
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    deals: (
      <section id="deals" className="mx-auto max-w-6xl px-5 py-12 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">{heading(siteData, "deals", "Great Deals")}</h2>
        <p className="mt-1 text-sm text-black/55">{subheading(siteData, "deals", "Get an exciting discount on great products!")}</p>
        <ProductTabs products={offers.length ? offers : products} siteData={siteData} />
        {products.length > 0 && (
          <div className="mt-8"><BrandButton as="a" href="#featured">View all</BrandButton></div>
        )}
      </section>
    ),
    featured: (
      <section id="featured" className="bg-[#FAFAFA]">
        <div className="mx-auto max-w-6xl px-5 py-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{heading(siteData, "featured", "Featured Products")}</h2>
          <p className="mt-1 text-sm text-black/55">{subheading(siteData, "featured", "Get your desired product from our featured range!")}</p>
          <ProductTabs products={bestSellers.length ? bestSellers : products} siteData={siteData} />
          {products.length > 0 && (
            <div className="mt-8"><BrandButton as="a" href="#categories">View all</BrandButton></div>
          )}
        </div>
      </section>
    ),
    testimonials: (testimonialsOf(siteData).length === 0 && !editing) ? null : (
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{heading(siteData, "testimonials", "What Our Clients Say About Us")}</h2>
        {testimonialsOf(siteData).length === 0 ? (
          <p className="mt-6 text-center text-sm text-black/50">Add reviews in the editor to show them here. (Hidden on your live site until you do.)</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonialsOf(siteData).map((t, i) => (
              <figure key={t.id || i} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex gap-1 text-amber-400">{[0, 1, 2, 3, 4].map((n) => <Star key={n} className="h-4 w-4 fill-current" />)}</div>
                {t.role ? <p className="mt-3 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>{t.role}</p> : null}
                <blockquote className="mt-2 text-sm text-black/65">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <Img src={t.image || `https://picsum.photos/seed/fh-rev${i}/64`} className="h-10 w-10 rounded-full object-cover" />
                  <div><span className="block text-sm font-semibold">{t.name}</span></div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    ),
    blog: posts.length === 0 ? null : (
      <section id="blog" className="bg-[#FAFAFA]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{heading(siteData, "blog", "Recent blog posts")}</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {posts[0] && (
              <a href={posts[0].linkUrl || "#"} className="group block overflow-hidden rounded-2xl bg-white shadow-sm">
                <Img src={posts[0].image} className="aspect-[16/9] w-full object-cover" />
                <div className="p-5">
                  {posts[0].date ? <p className="text-xs font-medium" style={{ color: "var(--brand-primary)" }}>{posts[0].date}</p> : null}
                  <h3 className="mt-1 flex items-start justify-between gap-2 text-lg font-semibold">{posts[0].title}<ArrowUpRight className="h-4 w-4 shrink-0 opacity-40 transition group-hover:opacity-100" /></h3>
                  {posts[0].excerpt ? <p className="mt-2 text-sm text-black/55">{posts[0].excerpt}</p> : null}
                </div>
              </a>
            )}
            <div className="grid gap-6">
              {posts.slice(1).map((p) => (
                <a key={p.id} href={p.linkUrl || "#"} className="group flex gap-4 overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
                  <Img src={p.image} className="h-24 w-32 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 py-1">
                    {p.date ? <p className="text-xs font-medium" style={{ color: "var(--brand-primary)" }}>{p.date}</p> : null}
                    <h3 className="mt-0.5 flex items-start gap-1 text-sm font-semibold">{p.title}<ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-40 transition group-hover:opacity-100" /></h3>
                    {p.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-black/55">{p.excerpt}</p> : null}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {navItems(siteData, [["Home", "#"], ["Categories", "#categories"], ["Great Deals", "#deals"], ["Blog", "#blog"], ["About Us", "#"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
          <div className="flex items-center gap-4 text-black/70">
            <Search className="hidden h-5 w-5 sm:block" />
            <Heart className="hidden h-5 w-5 sm:block" />
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "trust", "categories", "deals", "featured", "banner", "testimonials", "blog", "donation"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="bg-[#23262B] text-white/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-white">{name}</p>
            <p className="mt-2 text-sm">Quality fashion delivered to your door, with secure Paystack checkout.</p>
            {siteData.phone ? <p className="mt-3 text-sm">{siteData.phone}</p> : null}
            {siteData.email ? <p className="text-sm">{siteData.email}</p> : null}
            <SocialIcons social={siteData.social} className="mt-3 text-white/60" />
          </div>
          <div><h4 className="text-sm font-semibold text-white">Company</h4><ul className="mt-3 space-y-2 text-sm"><li>Home</li><li>Great Deals</li><li>Blog</li><li>Contact Us</li></ul></div>
          <div><h4 className="text-sm font-semibold text-white">Help</h4><ul className="mt-3 space-y-2 text-sm"><li>Like FAQs</li><li>How to Buy</li><li>Report Abuse</li><li>Customer Service</li><li>Returns and Refunds</li></ul></div>
          <div>
            <h4 className="text-sm font-semibold text-white">Newsletter</h4>
            <div className="mt-3 flex flex-col gap-2">
              <input className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40" placeholder="Your email address" />
              <BrandButton className="px-4 py-2">Subscribe Now</BrandButton>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
