"use client";

import { ArrowRight, PlayCircle, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, BrandButton, Img, ProductCardV2, heading, subheading, navItems, headerCta, productCategories, sellingPrice, originalPrice, CustomSections, OrderedSections, NewsletterInput } from "./shared";
import { DonationSection } from "./DonationSection";
import { useStore } from "../store-context";
import { formatNaira } from "@/lib/utils";
import type { Product } from "@/lib/database.types";

const TRUST_ICONS = [Truck, RotateCcw, ShieldCheck];
const slug = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function LunoraFashion({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Ecommerce 2";
  const products = siteData.products || [];
  const store = useStore();
  const badges = siteData.trustBadges?.length
    ? siteData.trustBadges
    : [{ id: "1", title: "Free Shipping" }, { id: "2", title: "Easy Returns" }, { id: "3", title: "Secure Payment" }];
  // Categories come from the products' Category field, set in the Products backend.
  const catList = productCategories(products);

  const groups = catList
    .map((c) => ({ name: c.name, items: products.filter((p) => slug(p.category || "") === slug(c.name)) }))
    .filter((g) => g.items.length);
  const grouped = new Set(groups.flatMap((g) => g.items.map((p) => p.id)));
  const others = products.filter((p) => !grouped.has(p.id));
  if (others.length) groups.push({ name: "More", items: others });

  const bestSellers = products.filter((p) => p.bestSeller);
  const offer = products.find((p) => p.offer);
  const newArrival = products.find((p) => p.newArrival);
  const addToCart = (p: typeof products[number]) =>
    store.addToCart({ id: p.id, name: p.name, price: sellingPrice(p), images: p.image ? [p.image] : [], stock: 99, is_active: true } as Product);

  const blocks: Record<string, React.ReactNode> = {
    donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
    hero: (
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 lg:grid-cols-[55%_45%]">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-black/40">New Collection</span>
            <h1 className="mt-4 font-serif text-5xl font-bold leading-[1.05] sm:text-6xl">{siteData.heroHeadline}</h1>
            <p className="mt-5 max-w-md text-lg italic text-black/60">{siteData.heroSubtext}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <BrandButton as="a" href={siteData.ctaHref || "#allproducts"}>{siteData.ctaText || "Shop Now"} <ArrowRight className="h-4 w-4" /></BrandButton>
              {siteData.heroVideoUrl && (
                <a href={siteData.heroVideoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium"><PlayCircle className="h-5 w-5" /> Hear from the store owner</a>
              )}
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
              {badges.map((b, i) => {
                const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
                return <div key={b.id || i} className="flex items-center gap-2"><Icon className="h-5 w-5 text-black/50" /><span className="text-xs text-black/60">{b.title}</span></div>;
              })}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl"><Img src={siteData.heroImage} className="h-full w-full object-cover" /></div>
          </div>
        </div>
      </section>
    ),
    catcircles: (
      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-5 py-6">
          {catList.map((c, i) => (
            <a key={c.name || i} href={`#cat-${slug(c.name)}`} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
              {c.name === "Sale" ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-xs font-bold text-white">SALE</div>
              ) : (
                <div className="h-16 w-16 overflow-hidden rounded-full bg-black/5"><Img src={c.image || `https://picsum.photos/seed/lun-cat${i}/120`} className="h-full w-full object-cover" /></div>
              )}
              <span className="text-xs text-black/60">{c.name}</span>
            </a>
          ))}
        </div>
      </section>
    ),
    categories: (
      <section id="collections" className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between">
          <div><span className="text-xs uppercase tracking-[0.3em] text-black/40">Shop by Category</span><h2 className="mt-2 font-serif text-3xl font-bold">{heading(siteData, "categories", "Find Your Perfect Style")}</h2></div>
          <a href="#allproducts" className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>View All →</a>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {catList.map((c, i) => (
            <a key={c.name || i} href={`#cat-${slug(c.name)}`} className="group relative aspect-[16/10] overflow-hidden rounded-2xl">
              <Img src={c.image || `https://picsum.photos/seed/lun-grid${i}/900/560`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-5 left-5 text-white"><p className="text-xl font-semibold">{c.name}</p><p className="text-sm">Explore Now →</p></div>
            </a>
          ))}
        </div>
      </section>
    ),
    allproducts: (
      <section id="allproducts" className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="font-serif text-3xl font-bold">{heading(siteData, "allproducts", "All Products")}</h2>
        {groups.length === 0 && <p className="mt-4 text-sm text-black/50">Products you add in your dashboard appear here, grouped by category.</p>}
        {groups.map((g) => (
          <div key={g.name} id={`cat-${slug(g.name)}`} className="scroll-mt-24 pt-10 first:pt-6">
            <h3 className="text-lg font-semibold">{g.name}</h3>
            <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {g.items.map((p) => <ProductCardV2 key={p.id} product={p} siteData={siteData} />)}
            </div>
          </div>
        ))}
      </section>
    ),
    promo: (
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-14 md:grid-cols-2">
        {/* Limited time offer */}
        <div className="flex items-center gap-4 overflow-hidden rounded-2xl bg-[#F3EFE9] p-6">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/40">Limited Time Offer</span>
            {offer ? (
              <>
                <h3 className="mt-2 font-serif text-2xl font-bold">{offer.name}</h3>
                <p className="mt-1 text-sm"><span className="font-semibold">{formatNaira(sellingPrice(offer))}</span>{originalPrice(offer) ? <span className="ml-2 text-black/40 line-through">{formatNaira(originalPrice(offer)!)}</span> : null}{offer.offerPercent ? <span className="ml-2 font-semibold" style={{ color: "var(--brand-primary)" }}>-{offer.offerPercent}%</span> : null}</p>
                <button onClick={() => addToCart(offer)} className="mt-3 inline-block rounded-md px-4 py-2 text-sm font-semibold" style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}>Shop the Sale</button>
              </>
            ) : (
              <p className="mt-2 text-sm text-black/50">Mark a product as “On offer” to feature it here.</p>
            )}
          </div>
          {offer?.image && <div className="hidden h-28 w-28 shrink-0 overflow-hidden rounded-xl sm:block"><Img src={offer.image} className="h-full w-full object-cover" /></div>}
        </div>
        {/* New arrival */}
        <div className="flex items-center gap-4 overflow-hidden rounded-2xl bg-[#F3EFE9] p-6">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/40">New Arrivals</span>
            {newArrival ? (
              <>
                <h3 className="mt-2 font-serif text-2xl font-bold">{newArrival.name}</h3>
                <a href={`#cat-${slug(newArrival.category || "")}`} className="mt-3 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Explore New In →</a>
              </>
            ) : (
              <p className="mt-2 text-sm text-black/50">Mark a product as “New arrival” to feature it here.</p>
            )}
          </div>
          {newArrival?.image && <div className="hidden h-28 w-28 shrink-0 overflow-hidden rounded-xl sm:block"><Img src={newArrival.image} className="h-full w-full object-cover" /></div>}
        </div>
      </section>
    ),
    bestsellers: (
      <section id="products" className="mx-auto max-w-6xl px-5 pb-14">
        <div className="flex items-end justify-between">
          <div><span className="text-xs uppercase tracking-[0.3em] text-black/40">Best Sellers</span><h2 className="mt-2 font-serif text-3xl font-bold">{heading(siteData, "bestsellers", "Our Most Loved Picks")}</h2></div>
        </div>
        {bestSellers.length === 0 ? (
          <p className="mt-4 text-sm text-black/50">Mark products as “Best seller” in your dashboard to feature them here.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
            {bestSellers.map((p) => <ProductCardV2 key={p.id} product={p} siteData={siteData} />)}
          </div>
        )}
      </section>
    ),
    newsletter: (
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 md:grid-cols-2">
          <div className="aspect-[16/10] overflow-hidden rounded-2xl"><Img src={siteData.sectionImages?.newsletter || "https://picsum.photos/seed/lun-news/900/560"} className="h-full w-full object-cover" /></div>
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-black/40">Get 10% off your first order</span>
            <h2 className="mt-2 font-serif text-3xl font-bold">{heading(siteData, "newsletter", "Join Our Style List")}</h2>
            <p className="mt-3 text-black/60">{subheading(siteData, "newsletter", "Be first to know about new arrivals, sales and style tips.")}</p>
            {siteData.showNewsletter !== false && <div className="mt-5"><NewsletterInput buttonText="Subscribe" /></div>}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-[#FAF8F5] font-sans text-[#0A0A0A]">
      <header className="border-b border-black/5 bg-[#FAF8F5]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-sm font-semibold uppercase tracking-[0.2em]" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {navItems(siteData, [["Home","#"],["Shop","#allproducts"],["Collections","#collections"],["Best Sellers","#products"],["Offers","#promo"]]).map(([l, h]) => <a key={l} href={h}>{l}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href="#" className="rounded-md border border-black/20 px-4 py-2 text-sm">Login</a>
            {(() => { const c = headerCta(siteData, "Register"); return <BrandButton as="a" href={c.href} className="px-4 py-2">{c.text}</BrandButton>; })()}
          </div>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "catcircles", "categories", "allproducts", "promo", "bestsellers", "newsletter", "donation"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />
      <footer className="bg-[#0A0A0A] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-lg font-semibold">{name}</p>
            <p className="mt-2 max-w-xs text-sm text-white/50">Curated fashion essentials for every day.</p>
            <SocialIcons social={siteData.social} className="mt-4 text-white/70" />
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
