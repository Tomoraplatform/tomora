"use client";

import { ArrowUpRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, BrandButton, SocialIcons,
  heading, subheading, servicesOf, navItems, ContactBlock, CustomSections, OrderedSections,
} from "./shared";

const FALLBACK_CATS = [
  { title: "Sofas", description: "Soft, sculptural seating." },
  { title: "Poufs", description: "Playful accent pieces." },
  { title: "Chairs", description: "Designer chairs, made to order." },
];

export function Seatwell({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Seatwell";
  const cats = servicesOf(siteData, FALLBACK_CATS);
  const items = (siteData.portfolioItems || []).filter((p) => p.image);
  const heroBtn = siteData.sectionButtons?.hero || {};
  const col = (k: string, fb: string) => siteData.sectionColors?.[k] || fb;

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <Img src={siteData.sectionImages?.hero} className="mx-auto aspect-[4/5] w-full max-w-sm rounded-3xl object-cover" />
          <div>
            <h1 className="text-4xl font-extrabold uppercase leading-[1.05] sm:text-5xl">{siteData.heroHeadline}</h1>
            <p className="mt-4 max-w-md text-black/55">{siteData.heroSubtext}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {siteData.ctaText ? <a href={siteData.ctaHref || "#contact"} className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white">{siteData.ctaText} <ArrowUpRight className="h-4 w-4" /></a> : null}
              {heroBtn.text ? <a href={heroBtn.url?.trim() || "#about"} className="text-sm font-semibold underline underline-offset-4">{heroBtn.text}</a> : null}
            </div>
          </div>
        </div>
      </section>
    ),
    categories: (
      <section id="categories" className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {cats.map((c, i) => (
            <div key={i} className="rounded-3xl p-6" style={{ background: col("categories", "#F5DEE4") }}>
              <h3 className="text-lg font-bold">{c.title}</h3>
              <p className="mt-1 text-sm text-black/55">{c.description}</p>
              <a href="#contact" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Go over <ArrowUpRight className="h-4 w-4" /></a>
            </div>
          ))}
        </div>
      </section>
    ),
    about: (
      <section id="about" className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">{heading(siteData, "about", "The art of modern furniture")}</h2>
          <p className="mt-4 leading-relaxed text-black/60">{subheading(siteData, "about", "")}</p>
          <BrandButton as="a" href="#contact" className="mt-6 rounded-full">Make an enquiry</BrandButton>
        </div>
        <Img src={siteData.sectionImages?.about} className="aspect-[4/3] w-full rounded-3xl object-cover" />
      </section>
    ),
    popular: items.length === 0 ? null : (
      <section id="popular" className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-2xl font-bold">{heading(siteData, "popular", "Popular pieces")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {items.slice(0, 4).map((p) => (
            <div key={p.id} className="rounded-2xl bg-[#F7F0F2] p-3">
              <Img src={p.image} className="aspect-square w-full rounded-xl object-cover" />
              <h3 className="mt-3 text-sm font-medium">{p.title}</h3>
              <a href="#contact" className="mt-1 inline-block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Enquire →</a>
            </div>
          ))}
        </div>
      </section>
    ),
    contact: (
      <div style={{ background: col("contact", "#EAF0F1") }}>
        <ContactBlock siteData={siteData} title={heading(siteData, "contact", "Enquire")} subtitle={subheading(siteData, "contact", "")} submitText="Make an enquiry" />
      </div>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {navItems(siteData, [["Home", "#"], ["Catalog", "#categories"], ["About", "#about"], ["Work", "#popular"], ["Contact", "#contact"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
          <BrandButton as="a" href="#contact" className="rounded-full px-4 py-2 text-xs">Enquire</BrandButton>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "categories", "about", "popular", "contact"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="border-t border-black/5 py-8 text-center text-sm text-black/40">
        <SocialIcons social={siteData.social} className="mb-3 justify-center" />
        © {new Date().getFullYear()} {name}. Built with Tomora.
      </footer>
    </BrandStyle>
  );
}
