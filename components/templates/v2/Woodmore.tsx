"use client";

import { Truck, Wallet, Headphones, ArrowRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, BrandButton, SocialIcons,
  heading, subheading, servicesOf, navItems, ContactBlock, CustomSections, OrderedSections,
} from "./shared";

const TRUST_ICONS = [Truck, Wallet, Headphones];
const FALLBACK_CATS = [
  { title: "Chairs", description: "Gaming, lounge, dining, office and more." },
  { title: "Sofas", description: "Reception, sectional, armless and curved." },
  { title: "Lighting", description: "Table, floor, ceiling and wall lights." },
];

export function Woodmore({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Woodmore";
  const badges = siteData.trustBadges || [];
  const cats = servicesOf(siteData, FALLBACK_CATS);
  const items = (siteData.portfolioItems || []).filter((p) => p.image);
  const col = (k: string, fb: string) => siteData.sectionColors?.[k] || fb;

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <section style={{ background: "#F3F4F2" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium">{name}</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl">{siteData.heroHeadline}</h1>
            <p className="mt-4 max-w-md text-black/60">{siteData.heroSubtext}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              {siteData.ctaText ? <BrandButton as="a" href={siteData.ctaHref || "#contact"}>{siteData.ctaText} <ArrowRight className="h-4 w-4" /></BrandButton> : null}
              <a href="#showcase" className="text-sm font-semibold underline underline-offset-4">View our work</a>
            </div>
          </div>
          <Img src={siteData.sectionImages?.hero} className="aspect-[4/3] w-full rounded-2xl object-cover" />
        </div>
      </section>
    ),
    trust: badges.length === 0 ? null : (
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-3">
        {badges.map((b, i) => {
          const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
          return (
            <div key={b.id || i} className="flex items-center gap-3">
              <Icon className="h-7 w-7 shrink-0" style={{ color: "var(--brand-primary)" }} />
              <div><p className="font-semibold">{b.title}</p>{b.subtitle ? <p className="text-sm text-black/50">{b.subtitle}</p> : null}</div>
            </div>
          );
        })}
      </section>
    ),
    categories: (
      <section id="categories" className="mx-auto max-w-6xl px-5 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{heading(siteData, "categories", "Explore our collection")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-black/55">{subheading(siteData, "categories", "")}</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {cats.map((c, i) => (
            <div key={i} className="rounded-3xl bg-[#F3F4F2] p-7">
              <h3 className="text-2xl font-bold">{c.title}</h3>
              <p className="mt-2 text-sm text-black/55">{c.description}</p>
              <a href="#contact" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Enquire <ArrowRight className="h-4 w-4" /></a>
            </div>
          ))}
        </div>
      </section>
    ),
    showcase: items.length === 0 ? null : (
      <section id="showcase" className="mx-auto max-w-6xl px-5 py-12">
        <div className="text-center">
          <span className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Our Work</span>
          <h2 className="mt-1 text-3xl font-bold sm:text-4xl">{heading(siteData, "showcase", "Our latest work")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-black/55">{subheading(siteData, "showcase", "")}</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-black/5">
              <Img src={p.image} className="aspect-square w-full object-cover" />
              <div className="p-5">
                <h3 className="font-semibold">{p.title}</h3>
                {p.description ? <p className="mt-1 text-sm text-black/55">{p.description}</p> : null}
                <a href="#contact" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Enquire <ArrowRight className="h-4 w-4" /></a>
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    contact: (
      <div className="text-white" style={{ background: col("contact", "#0F3D26") }}>
        <ContactBlock siteData={siteData} title={heading(siteData, "contact", "Enquire now")} subtitle={subheading(siteData, "contact", "")} tone="dark" submitText="Book a consultation" />
      </div>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {navItems(siteData, [["Home", "#"], ["Collections", "#categories"], ["Work", "#showcase"], ["Contact", "#contact"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
          <BrandButton as="a" href="#contact" className="px-4 py-2 text-xs">Book a consultation</BrandButton>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "trust", "categories", "showcase", "contact"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="border-t border-black/5 py-8 text-center text-sm text-black/40">
        <SocialIcons social={siteData.social} className="mb-3 justify-center" />
        © {new Date().getFullYear()} {name}. {siteData.footerCredit ?? "Built with Tomora"}
      </footer>
    </BrandStyle>
  );
}
