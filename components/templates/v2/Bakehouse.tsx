"use client";

import { Search, User, ShoppingCart } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, SocialIcons, BrandButton, ProductCardV2, Img,
  heading, navItems, productCategories, CustomSections, OrderedSections,
} from "./shared";
import { DonationSection } from "./DonationSection";
import { useStore } from "../store-context";
import { slugify } from "@/lib/utils";

/**
 * Editor / onboarding preview only. The live published site renders the real
 * multi-page storefront (components/published/bakery/*) with working links to
 * /category/[slug] and /product/[id] — this single-page version exists so the
 * template can be edited and previewed like every other catalog template.
 */
export function Bakehouse({ siteData, brandColor }: TemplateProps) {
  const store = useStore();
  const name = siteData.businessName || "Bakehouse";
  const products = siteData.products || [];
  const newArrivals = products.filter((p) => p.newArrival).slice(0, 4);
  const shownArrivals = newArrivals.length ? newArrivals : products.slice(0, 4);
  const categories = siteData.shopCategories?.length ? siteData.shopCategories : productCategories(products).map((c, i) => ({ id: `c${i}`, name: c.name, image: c.image }));
  const featured = products.find((p) => p.bestSeller) || products[0];

  // Real navigation only on the live site; inert in the editor/preview.
  const linkProps = (href: string) => store.live ? { href } : { href: undefined };

  const blocks: Record<string, React.ReactNode> = {
    donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
    hero: (
      <section className="relative">
        <Img src={siteData.heroImage} className="h-[420px] w-full object-cover sm:h-[520px]" />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-4 px-5 text-center text-white">
          <h1 className="max-w-lg text-3xl font-bold sm:text-4xl">{siteData.heroHeadline}</h1>
          <BrandButton as="a" {...linkProps(siteData.ctaHref || "#newarrivals")}>{siteData.ctaText || "Shop Now"}</BrandButton>
        </div>
      </section>
    ),
    newarrivals: (
      <section id="newarrivals" className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold uppercase tracking-wide">{heading(siteData, "newarrivals", "New Arrivals")}</h2>
          <a {...linkProps("#featured")} className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>See more →</a>
        </div>
        {shownArrivals.length === 0 ? (
          <p className="mt-6 text-sm text-black/50">Products you add in your dashboard will appear here.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
            {shownArrivals.map((p) => (
              <div key={p.id} className="relative">
                {p.isPreOrder && <span className="absolute left-2 top-2 z-10 rounded-full bg-black px-2.5 py-1 text-[10px] font-bold uppercase text-white">Pre-order</span>}
                <ProductCardV2 product={p} siteData={siteData} />
              </div>
            ))}
          </div>
        )}
      </section>
    ),
    categories: (
      <section id="categories" className="bg-[#FAF7F2]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold uppercase tracking-wide">{heading(siteData, "categories", "Shop by Category")}</h2>
            <a {...linkProps("#newarrivals")} className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>See more →</a>
          </div>
          {categories.length === 0 ? (
            <p className="mt-6 text-sm text-black/50">Categories are drawn from your products&apos; Category field.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {categories.slice(0, 6).map((c) => (
                <a key={c.id || c.name} {...linkProps(`/category/${slugify(c.name)}`)} className="group relative block aspect-[4/5] overflow-hidden rounded-lg">
                  <Img src={c.image} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/25" />
                  <span className="absolute inset-x-3 bottom-3 text-sm font-bold uppercase tracking-wide text-white">{c.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    ),
    featured: featured ? (
      <section id="featured" className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold uppercase tracking-wide">{heading(siteData, "featured", "Featured")}</h2>
          <a {...linkProps("#")} className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>View all collections →</a>
        </div>
        <div className="mt-8 max-w-xs">
          <ProductCardV2 product={featured} siteData={siteData} />
        </div>
      </section>
    ) : null,
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <nav className="order-2 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wide text-black/70 sm:order-1">
            {navItems(siteData, [["New Arrivals", "#newarrivals"], ["Categories", "#categories"]]).slice(0, 2).map(([l, h]) => <a key={l} href={h}>{l}</a>)}
          </nav>
          <div className="order-1 flex items-center justify-between sm:order-2 sm:justify-center">
            <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          </div>
          <div className="order-3 flex items-center justify-end gap-4 text-black/70">
            <Search className="h-5 w-5" />
            <User className="h-5 w-5" />
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "newarrivals", "categories", "featured", "donation"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="border-t border-black/5 bg-[#FAF7F2]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
          <div>
            <p className="text-lg font-bold">{name}</p>
            <SocialIcons social={siteData.social} className="mt-3 text-black/60" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-black/50">Get in touch</h4>
            <div className="mt-3 space-y-1 text-sm text-black/60">
              {siteData.address && <p>{siteData.address}</p>}
              {siteData.phone && <p>{siteData.phone}</p>}
              {siteData.email && <p>{siteData.email}</p>}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-black/50">Newsletter</h4>
            <p className="mt-2 text-sm text-black/60">Join our world and receive early access to new drops.</p>
          </div>
        </div>
        <div className="border-t border-black/5 py-5 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
