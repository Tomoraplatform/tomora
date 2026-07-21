"use client";

import { Quote, ArrowUpRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, BrandButton, SocialIcons,
  heading, subheading, servicesOf, testimonialsOf, navItems, ContactBlock, CustomSections, OrderedSections,
} from "./shared";

const FALLBACK_SERVICES = [
  { title: "Bespoke pieces", description: "One-of-a-kind commissions made to your brief." },
  { title: "Small-batch production", description: "Thoughtfully made in limited runs." },
  { title: "Restoration", description: "Careful repair and renewal of loved pieces." },
];

export function Atelier({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Atelier";
  const services = servicesOf(siteData, FALLBACK_SERVICES);
  const items = (siteData.portfolioItems || []).filter((p) => p.image);
  const col = (k: string, fb: string) => siteData.sectionColors?.[k] || fb;

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <section className="mx-auto max-w-6xl px-5 pt-10">
        <div className="grid items-end gap-6 lg:grid-cols-2">
          <div className="pb-6">
            <h1 className="font-serif text-5xl font-medium leading-[1.05] sm:text-6xl">{siteData.heroHeadline}</h1>
            <p className="mt-4 max-w-md text-black/60">{siteData.heroSubtext}</p>
            {siteData.ctaText ? <BrandButton as="a" href={siteData.ctaHref || "#contact"} className="mt-6">{siteData.ctaText}</BrandButton> : null}
          </div>
          <Img src={siteData.heroImage} className="aspect-[5/4] w-full rounded-3xl object-cover" />
        </div>
      </section>
    ),
    about: (
      <section id="about" className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <Img src={siteData.sectionImages?.about} className="aspect-[4/3] w-full rounded-3xl object-cover" />
        <div>
          <h2 className="font-serif text-4xl font-medium">{heading(siteData, "about", "About the studio")}</h2>
          <p className="mt-4 leading-relaxed text-black/60">{subheading(siteData, "about", "")}</p>
        </div>
      </section>
    ),
    gallery: (
      <section id="gallery" className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="font-serif text-4xl font-medium">{heading(siteData, "gallery", "Selected work")}</h2>
        <p className="mt-2 max-w-xl text-black/60">{subheading(siteData, "gallery", "")}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((p) => (
            <a key={p.id} href="#contact" className="group block overflow-hidden rounded-2xl bg-[#F3E8DE]">
              <Img src={p.image} className="aspect-[4/5] w-full object-cover" />
              <div className="p-5">
                <h3 className="flex items-start justify-between gap-2 font-semibold">{p.title}<ArrowUpRight className="h-4 w-4 shrink-0 opacity-40 transition group-hover:opacity-100" /></h3>
                {p.description ? <p className="mt-1 text-sm text-black/55">{p.description}</p> : null}
                <span className="mt-2 inline-block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Enquire</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    ),
    services: (
      <section id="services" style={{ background: col("services", "#F3E8DE") }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-4xl font-medium">{heading(siteData, "services", "What we do")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {services.map((s, i) => (
              <div key={i} className="rounded-2xl bg-white p-6">
                <span className="text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-black/60">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    testimonials: (testimonialsOf(siteData).length === 0) ? null : (
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center font-serif text-4xl font-medium">{heading(siteData, "testimonials", "Kind words")}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {testimonialsOf(siteData).slice(0, 2).map((t, i) => (
            <figure key={t.id || i} className="rounded-2xl border border-black/10 p-6">
              <Quote className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
              <blockquote className="mt-3 text-black/70">{t.quote}</blockquote>
              <figcaption className="mt-4 text-sm font-semibold">{t.name}{t.role ? ` · ${t.role}` : ""}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    ),
    contact: (
      <div style={{ background: col("contact", "#F7F1EA") }}>
        <ContactBlock siteData={siteData} title={heading(siteData, "contact", "Get in touch")} subtitle={subheading(siteData, "contact", "")} submitText="Make an enquiry" />
      </div>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-[#FBF7F2] font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="font-serif text-xl font-medium" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {navItems(siteData, [["Home", "#"], ["About", "#about"], ["Work", "#gallery"], ["Services", "#services"], ["Contact", "#contact"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
          <BrandButton as="a" href="#contact" className="px-4 py-2 text-xs">Enquire</BrandButton>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "about", "gallery", "services", "testimonials", "contact"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="border-t border-black/5 py-8 text-center text-sm text-black/40">
        <SocialIcons social={siteData.social} className="mb-3 justify-center" />
        © {new Date().getFullYear()} {name}. {siteData.footerCredit ?? "Built with Tomora"}
      </footer>
    </BrandStyle>
  );
}
