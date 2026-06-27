"use client";

import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones, Quote, ShoppingCart } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, testimonialsOf, BrandButton, OutlineButton, ProductCardV2, Img, heading, subheading, navItems, productCategories, CustomSections, OrderedSections } from "./shared";
import { DonationSection } from "./DonationSection";
import { useTemplateEdit } from "../editor-context";

const TINTS = ["#dbeafe", "#fce7f3", "#fef9c3", "#ede9fe", "#ccfbf1", "#ffedd5"];

const TRUST_ICONS = [Truck, ShieldCheck, RotateCcw, Headphones];
const slug = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function ShopMate({ siteData, brandColor }: TemplateProps) {
  const { editing } = useTemplateEdit();
  const name = siteData.businessName || "Ecommerce One";
  const products = siteData.products || [];
  const badges = siteData.trustBadges?.length
    ? siteData.trustBadges
    : [
        { id: "1", title: "Free Shipping", subtitle: "On orders over ₦20,000" },
        { id: "2", title: "Secure Payment", subtitle: "100% secure payment" },
        { id: "3", title: "Easy Returns", subtitle: "30 days return policy" },
        { id: "4", title: "24/7 Support", subtitle: "Dedicated support" },
      ];
  // Categories come from the products' Category field, set in the Products backend.
  const cats = productCategories(products);

  // All products grouped by category (matched to the category chips by slug).
  const groups = cats
    .map((c) => ({ name: c.name, items: products.filter((p) => slug(p.category || "") === slug(c.name)) }))
    .filter((g) => g.items.length);
  const grouped = new Set(groups.flatMap((g) => g.items.map((p) => p.id)));
  const others = products.filter((p) => !grouped.has(p.id));
  if (others.length) groups.push({ name: "More", items: others });

  // Best sellers + offers are flagged by the store owner.
  const bestSellers = products.filter((p) => p.bestSeller);
  const offers = products.filter((p) => p.offer);
  const BEST_LIMIT = 5;

  const blocks: Record<string, React.ReactNode> = {
    donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
    banner: siteData.sectionImages?.banner ? (
      <section id="banner" className="mx-auto max-w-6xl px-5 py-6"><Img src={siteData.sectionImages.banner} className="w-full rounded-2xl object-cover" /></section>
    ) : null,
    hero: (
      <section className="bg-[#FBFAF7]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}>NEW ARRIVALS</span>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">{siteData.heroHeadline}</h1>
            <p className="mt-4 max-w-md text-black/60">{siteData.heroSubtext}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <BrandButton as="a" href={siteData.ctaHref || "#allproducts"}>{siteData.ctaText || "Shop Now"} <ArrowRight className="h-4 w-4" /></BrandButton>
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
    ),
    trust: (
      <section className="border-y border-black/5">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <div key={b.id || i} className="flex items-center gap-3">
                <Icon className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
                <div><p className="text-sm font-semibold">{b.title}</p>{b.subtitle ? <p className="text-xs text-black/50">{b.subtitle}</p> : null}</div>
              </div>
            );
          })}
        </div>
      </section>
    ),
    categories: (
      <section id="categories" className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">{heading(siteData, "categories", "Shop by Categories")}</h2>
          <a href="#allproducts" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--brand-primary)" }}>View All <ArrowRight className="h-4 w-4" /></a>
        </div>
        <div className="mt-8 flex gap-6 overflow-x-auto pb-2">
          {cats.map((c, i) => (
            <a key={c.name || i} href={`#cat-${slug(c.name)}`} className="flex w-24 shrink-0 flex-col items-center gap-2 text-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full" style={{ background: TINTS[i % TINTS.length] }}>
                <Img src={c.image || `https://picsum.photos/seed/cat${i}/120`} className="h-12 w-12 rounded-full object-cover" />
              </div>
              <span className="text-xs font-medium text-black/70">{c.name}</span>
            </a>
          ))}
        </div>
      </section>
    ),
    allproducts: (
      <section id="allproducts" className="bg-[#FBFAF7]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-2xl font-bold">{heading(siteData, "allproducts", "All Products")}</h2>
          {groups.length === 0 && <p className="mt-4 text-sm text-black/50">Products you add in your dashboard will appear here, grouped by category.</p>}
          {groups.map((g) => (
            <div key={g.name} id={`cat-${slug(g.name)}`} className="scroll-mt-24 pt-10 first:pt-6">
              <h3 className="text-lg font-semibold">{g.name}</h3>
              <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {g.items.map((p) => <ProductCardV2 key={p.id} product={p} siteData={siteData} />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    bestsellers: (
      <section id="bestsellers" className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">{heading(siteData, "bestsellers", "Best Selling Products")}</h2>
          {bestSellers.length > BEST_LIMIT && (
            <a href="#allproducts" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--brand-primary)" }}>View All <ArrowRight className="h-4 w-4" /></a>
          )}
        </div>
        {bestSellers.length === 0 ? (
          <p className="mt-4 text-sm text-black/50">Mark products as “Best seller” in your dashboard to feature them here.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {bestSellers.slice(0, BEST_LIMIT).map((p) => <ProductCardV2 key={p.id} product={p} siteData={siteData} />)}
          </div>
        )}
      </section>
    ),
    // Hide the special-offer section on the live site unless a product is flagged.
    offer: (offers.length === 0 && !editing) ? null : (
      <section id="offer" className="bg-[#F3EFE6]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Special Offer</span>
          <h2 className="mt-2 font-serif text-4xl font-bold">{heading(siteData, "sale", "Up to 50% Off")}</h2>
          <p className="mt-3 max-w-xl text-black/60">{subheading(siteData, "sale", "Limited time savings across our best-selling categories. Don't miss out.")}</p>
          {offers.length === 0 ? (
            <p className="mt-6 text-sm text-black/50">Mark a product as “On offer” in your dashboard to feature it here. (This section is hidden on your live site until you do.)</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {offers.map((p) => <ProductCardV2 key={p.id} product={p} siteData={siteData} />)}
            </div>
          )}
        </div>
      </section>
    ),
    // Hide the reviews section on the live site until the owner adds real reviews.
    testimonials: (testimonialsOf(siteData).length === 0 && !editing) ? null : (
      <section className="bg-[#FBFAF7]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-center text-2xl font-bold">{heading(siteData, "testimonials", "What Our Customers Say")}</h2>
          {testimonialsOf(siteData).length === 0 ? (
            <p className="mt-6 text-center text-sm text-black/50">Add customer reviews in the editor to show them here. (Hidden on your live site until you do.)</p>
          ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonialsOf(siteData).map((t, i) => (
              <figure key={t.id || i} className="rounded-2xl bg-white p-6 shadow-sm">
                <Quote className="h-7 w-7" style={{ color: "var(--brand-primary)" }} />
                <blockquote className="mt-3 text-sm text-black/70">{t.quote}</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <Img src={t.image || `https://picsum.photos/seed/rev${i}/64`} className="h-10 w-10 rounded-full object-cover" />
                  <div><span className="block text-sm font-semibold">{t.name}</span>{t.role ? <span className="block text-xs text-black/50">{t.role}</span> : null}</div>
                </figcaption>
              </figure>
            ))}
          </div>
          )}
        </div>
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-xl font-bold" />
          <nav className="hidden gap-7 text-sm text-black/60 md:flex">
            {navItems(siteData, [["Categories","#categories"],["Shop","#allproducts"],["Deals","#offer"]]).map(([l, h]) => <a key={l} href={h}>{l}</a>)}
          </nav>
          <button className="relative" aria-label="Cart"><ShoppingCart className="h-5 w-5" /></button>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "trust", "categories", "allproducts", "banner", "bestsellers", "offer", "testimonials", "donation"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />
      <ShopFooter name={name} social={siteData.social} />
    </BrandStyle>
  );
}

function ShopFooter({ name, social }: { name: string; social?: any }) {
  return (
      <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-lg font-bold">{name}</p><p className="mt-2 text-sm text-black/50">Quality products delivered to your door, with secure Paystack checkout.</p><SocialIcons social={social} className="mt-3 text-black/60" /></div>
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
