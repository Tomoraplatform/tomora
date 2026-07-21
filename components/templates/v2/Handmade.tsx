"use client";

import { Heart, Globe, Sparkles, Clock } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, BrandButton,
  heading, subheading, servicesOf, navItems, ContactBlock, CustomSections, OrderedSections,
} from "./shared";

const WHY_ICONS = [Heart, Globe, Sparkles, Clock];
const FALLBACK_WHY = [
  { title: "Exclusively hand-knitted", description: "Every piece is made only by hand, with care." },
  { title: "Worldwide delivery", description: "Fast and timely shipping, wherever you are." },
  { title: "Hypoallergenic yarn", description: "Soft, quality yarn that's kind to your skin." },
  { title: "Made in 5 days", description: "Most orders are ready within five working days." },
];

export function Handmade({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Handmade";
  const overlay = siteData.heroOverlayColor || "#241C14";
  const why = servicesOf(siteData, FALLBACK_WHY);
  const items = (siteData.portfolioItems || []).filter((p) => p.image);
  const eyebrow = (k: string) => siteData.sectionEyebrows?.[k];
  const col = (k: string, fb: string) => siteData.sectionColors?.[k] || fb;

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <section className="relative">
        <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to right, ${overlay}E6, ${overlay}66)` }} />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-32 text-white sm:pt-40">
          <h1 className="max-w-xl text-4xl font-extrabold uppercase leading-tight sm:text-5xl">{siteData.heroHeadline}</h1>
          <p className="mt-3 text-white/80">{siteData.heroSubtext}</p>
          {siteData.ctaText ? <BrandButton as="a" href={siteData.ctaHref || "#contact"} className="mt-7">{siteData.ctaText}</BrandButton> : null}
        </div>
      </section>
    ),
    why: (
      <section id="why" className="mx-auto max-w-6xl px-5 py-16 text-center">
        {eyebrow("why") ? <span className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>{eyebrow("why")}</span> : null}
        <h2 className="mt-1 text-3xl font-bold">{heading(siteData, "why", "Why should you choose me")}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((s, i) => {
            const Icon = WHY_ICONS[i % WHY_ICONS.length];
            return (
              <div key={i} className="rounded-2xl bg-[#F3ECE2] p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white" style={{ color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-black/55">{s.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    ),
    catalog: (
      <section id="catalog" className="text-white" style={{ background: col("catalog", "#241C14") }}>
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          {eyebrow("catalog") ? <span className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>{eyebrow("catalog")}</span> : null}
          <h2 className="mt-1 text-3xl font-bold">{heading(siteData, "catalog", "You can order")}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {items.slice(0, 6).map((p) => (
              <div key={p.id} className="overflow-hidden rounded-2xl bg-white/10">
                <Img src={p.image} className="aspect-[4/5] w-full object-cover" />
                <div className="p-4"><h3 className="font-semibold">{p.title}</h3>{p.description ? <p className="mt-1 text-sm text-white/60">{p.description}</p> : null}</div>
              </div>
            ))}
          </div>
          <BrandButton as="a" href="#contact" className="mt-8">Contact me</BrandButton>
        </div>
      </section>
    ),
    about: (
      <section id="about" className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          {eyebrow("about") ? <span className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>{eyebrow("about")}</span> : null}
          <h2 className="mt-1 text-3xl font-bold">{heading(siteData, "about", "Who I Am")}</h2>
        </div>
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            {subheading(siteData, "about", "").split("\n").filter(Boolean).map((para, i) => (
              <p key={i} className="rounded-2xl bg-[#F3ECE2] p-5 text-black/70">{para}</p>
            ))}
          </div>
          <Img src={siteData.sectionImages?.about} className="mx-auto aspect-[4/5] w-full max-w-sm rounded-2xl object-cover" />
        </div>
      </section>
    ),
    contact: (
      <div style={{ background: col("contact", "#241C14") }}>
        <ContactBlock siteData={siteData} title={heading(siteData, "contact", "Leave a response")} subtitle={subheading(siteData, "contact", "")} tone="dark" submitText="Contact me" />
      </div>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 text-white">
          <Brandmark siteData={siteData} name={name} className="font-serif text-xl font-medium" />
          <nav className="hidden gap-6 text-sm text-white/80 lg:flex">
            {navItems(siteData, [["Home", "#"], ["Why me", "#why"], ["About me", "#about"], ["Catalog", "#catalog"], ["Contacts", "#contact"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-white">{l}</a>)}
          </nav>
          {siteData.phone ? <a href={`tel:${siteData.phone}`} className="hidden text-sm text-white/80 sm:block">{siteData.phone}</a> : null}
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "why", "catalog", "about", "contact"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="py-8 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. {siteData.footerCredit ?? "Built with Tomora"}</footer>
    </BrandStyle>
  );
}
