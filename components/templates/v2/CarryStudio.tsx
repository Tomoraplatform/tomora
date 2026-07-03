"use client";

import { Quote } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, BrandButton, SocialIcons,
  heading, subheading, testimonialsOf, navItems, ContactBlock, CustomSections, OrderedSections,
} from "./shared";

export function CarryStudio({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Studio";
  const items = (siteData.portfolioItems || []).filter((p) => p.image);
  const aboutBtn = siteData.sectionButtons?.about || {};
  const col = (k: string, fb: string) => siteData.sectionColors?.[k] || fb;

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <section className="grid items-center gap-8 lg:grid-cols-2" style={{ background: "#EEF2F0" }}>
        <Img src={siteData.heroImage} className="h-64 w-full object-cover lg:h-full" />
        <div className="px-5 py-16 lg:pr-16">
          <h1 className="font-serif text-4xl font-medium leading-tight sm:text-6xl">{siteData.heroHeadline}</h1>
          <p className="mt-4 max-w-md text-black/60">{siteData.heroSubtext}</p>
          {siteData.ctaText ? <BrandButton as="a" href={siteData.ctaHref || "#contact"} className="mt-6 rounded-none">{siteData.ctaText}</BrandButton> : null}
        </div>
      </section>
    ),
    showcase: (
      <section id="showcase" className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="font-serif text-3xl font-medium sm:text-4xl">{heading(siteData, "showcase", "Featured pieces")}</h2>
        <p className="mx-auto mt-2 max-w-xl text-black/55">{subheading(siteData, "showcase", "")}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((p) => (
            <div key={p.id} className="rounded-xl bg-[#F4F6F5] p-3 text-left">
              <Img src={p.image} className="aspect-square w-full rounded-lg object-cover" />
              <h3 className="mt-3 font-medium">{p.title}</h3>
              {p.description ? <p className="mt-1 line-clamp-2 text-xs text-black/50">{p.description}</p> : null}
              <a href="#contact" className="mt-2 inline-block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>Enquire →</a>
            </div>
          ))}
        </div>
      </section>
    ),
    about: (
      <section id="about" style={{ background: col("about", "#E7EEEA") }}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-medium sm:text-4xl">{heading(siteData, "about", "Embracing style and utility")}</h2>
            <p className="mt-4 leading-relaxed text-black/60">{subheading(siteData, "about", "")}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <BrandButton as="a" href={aboutBtn.url?.trim() || "#contact"} className="rounded-none">{aboutBtn.text || "Make an enquiry"}</BrandButton>
              <a href="#showcase" className="text-sm font-semibold underline underline-offset-4">See the work</a>
            </div>
          </div>
          <Img src={siteData.sectionImages?.about} className="mx-auto aspect-[4/5] w-full max-w-xs rounded-[999px] object-cover" />
        </div>
      </section>
    ),
    gallery: items.length === 0 ? null : (
      <section id="gallery" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold">{heading(siteData, "gallery", "Find your perfect piece")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.slice(0, 6).map((p) => (
            <a key={p.id} href="#contact" className="block overflow-hidden rounded-xl bg-[#F4F6F5]">
              <Img src={p.image} className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105" />
            </a>
          ))}
        </div>
      </section>
    ),
    testimonials: (testimonialsOf(siteData).length === 0) ? null : (
      <section style={{ background: col("testimonials", "#E7EEEA") }}>
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center font-serif text-3xl font-medium">{heading(siteData, "testimonials", "Loved by clients")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {testimonialsOf(siteData).slice(0, 2).map((t, i) => (
              <figure key={t.id || i} className="rounded-2xl bg-white p-6">
                <Quote className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
                <blockquote className="mt-3 text-black/70">{t.quote}</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{t.name}{t.role ? ` · ${t.role}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    ),
    contact: (
      <ContactBlock siteData={siteData} title={heading(siteData, "contact", "Make an enquiry")} subtitle={subheading(siteData, "contact", "")} submitText="Send enquiry" />
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <div className="py-2 text-center text-xs text-white" style={{ background: "var(--brand-primary)" }}>Get in touch for a bespoke commission or custom order.</div>
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="font-serif text-xl font-medium" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {navItems(siteData, [["Home", "#"], ["About", "#about"], ["Showcase", "#showcase"], ["Gallery", "#gallery"], ["Contact", "#contact"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
          <BrandButton as="a" href="#contact" className="px-4 py-2 text-xs">Enquire</BrandButton>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "showcase", "about", "gallery", "testimonials", "contact"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="border-t border-black/5 py-8 text-center text-sm text-black/40">
        <SocialIcons social={siteData.social} className="mb-3 justify-center" />
        © {new Date().getFullYear()} {name}. Built with Tomora.
      </footer>
    </BrandStyle>
  );
}
