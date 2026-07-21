"use client";

import { Quote } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, BrandButton, SocialIcons,
  heading, subheading, servicesOf, testimonialsOf, navItems, VideoLinkGrid, CustomSections, OrderedSections,
} from "./shared";
import { ResultsSection } from "./ResultsSection";

function Marquee({ text, bg }: { text: string; bg: string }) {
  return (
    <div className="overflow-hidden py-2.5 text-xs font-semibold uppercase tracking-widest text-white" style={{ background: bg }}>
      <div className="flex whitespace-nowrap">{[0, 1, 2, 3].map((i) => <span key={i} className="px-4">{text} ·</span>)}</div>
    </div>
  );
}

const FALLBACK_SERVICES = [
  { title: "The Signature Look", description: "A complete look built around your body, lifestyle and goals." },
  { title: "Capsule Wardrobe", description: "A versatile, mix-and-match wardrobe that works for everything." },
  { title: "Brand Styling", description: "Show up polished and on-brand for shoots, launches and events." },
];

export function Tailored({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Tailored";
  const overlay = siteData.heroOverlayColor || "#8A2E4D";
  const services = servicesOf(siteData, FALLBACK_SERVICES);
  const projects = (siteData.portfolioItems || []).filter((p) => p.image);
  const aboutBtn = siteData.sectionButtons?.about || {};
  const ctaBtn = siteData.sectionButtons?.cta || {};
  const col = (k: string, fb: string) => siteData.sectionColors?.[k] || fb;

  const blocks: Record<string, React.ReactNode> = {
    beforeAfter: <ResultsSection siteData={siteData} brandColor={brandColor} />,
    hero: (
      <section className="relative">
        <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: `${overlay}66` }} />
        <div className="relative mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center px-5 py-24 text-center text-white">
          <h1 className="font-serif text-4xl font-medium leading-tight sm:text-6xl">{siteData.heroHeadline}</h1>
          <p className="mt-4 max-w-xl text-white/85">{siteData.heroSubtext}</p>
          {siteData.ctaText ? (
            <a href={siteData.ctaHref || "#services"} className="mt-7 rounded-full bg-white px-7 py-3 text-sm font-semibold" style={{ color: overlay }}>{siteData.ctaText}</a>
          ) : null}
        </div>
      </section>
    ),
    marquee: <Marquee text={heading(siteData, "marquee", "Confident · Elevated style · Curated for you")} bg={col("marquee", "var(--brand-primary)")} />,
    about: (
      <section id="about" className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <Img src={siteData.sectionImages?.about} className="mx-auto aspect-[4/5] w-full max-w-sm rounded-2xl object-cover" />
        <div>
          <h2 className="font-serif text-4xl font-medium">{heading(siteData, "about", "About The Stylist")}</h2>
          <p className="mt-4 leading-relaxed text-black/60">{subheading(siteData, "about", "")}</p>
          {aboutBtn.text ? <BrandButton as="a" href={aboutBtn.url?.trim() || "#services"} className="mt-6 rounded-full">{aboutBtn.text}</BrandButton> : null}
        </div>
      </section>
    ),
    services: (
      <section id="services" style={{ background: col("services", "#F2D6E0") }}>
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="font-serif text-4xl font-medium">{heading(siteData, "services", "Styling Services")}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {services.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <span className="mx-auto block h-3 w-3 rounded-full" style={{ background: "var(--brand-primary)" }} />
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-black/60">{s.description}</p>
                <a href="#cta" className="mt-4 inline-block rounded-full px-5 py-2 text-xs font-semibold text-white" style={{ background: "var(--brand-primary)" }}>Enquire Now</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    portfolio: projects.length === 0 ? null : (
      <section id="portfolio" style={{ background: col("portfolio", "var(--brand-primary)") }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center font-serif text-4xl font-medium text-white">{heading(siteData, "portfolio", "Portfolio")}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {projects.slice(0, 6).map((p) => <Img key={p.id} src={p.image} className="aspect-[4/5] w-full rounded-2xl object-cover" />)}
          </div>
        </div>
      </section>
    ),
    testimonials: (testimonialsOf(siteData).length === 0) ? null : (
      <section style={{ background: col("testimonials", "#C98BA3") }}>
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-white">
          {testimonialsOf(siteData).slice(0, 1).map((t, i) => (
            <figure key={t.id || i}>
              <Quote className="mx-auto h-8 w-8 opacity-70" />
              <blockquote className="mt-4 font-serif text-2xl leading-relaxed">{t.quote}</blockquote>
              <figcaption className="mt-4 text-sm font-semibold uppercase tracking-wide">{t.name}{t.role ? ` · ${t.role}` : ""}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    ),
    videos: (
      <section id="videos" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center font-serif text-4xl font-medium">{heading(siteData, "videos", "Watch & Learn")}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-black/60">{subheading(siteData, "videos", "")}</p>
        <div className="mt-8"><VideoLinkGrid videos={siteData.videoLinks} /></div>
      </section>
    ),
    cta: (
      <section id="cta" style={{ background: col("cta", "#F5E6EB") }}>
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-16 lg:grid-cols-2">
          <Img src={siteData.sectionImages?.cta} className="mx-auto aspect-[3/4] w-full max-w-[260px] rounded-2xl object-cover" />
          <div>
            <h2 className="font-serif text-3xl font-medium sm:text-4xl">{heading(siteData, "cta", "Unlock Your Style Secrets")}</h2>
            <p className="mt-3 text-black/60">{subheading(siteData, "cta", "")}</p>
            <BrandButton as="a" href={ctaBtn.url?.trim() || (siteData.email ? `mailto:${siteData.email}` : "#")} className="mt-6 rounded-full">{ctaBtn.text || "Download the Guide"}</BrandButton>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="font-serif text-xl font-medium" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {navItems(siteData, [["Home", "#"], ["About", "#about"], ["Services", "#services"], ["Portfolio", "#portfolio"], ["Videos", "#videos"], ["Contact", "#cta"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
          <BrandButton as="a" href="#cta" className="rounded-full px-4 py-2 text-xs">Book</BrandButton>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "marquee", "about", "services", "portfolio", "beforeAfter", "testimonials", "videos", "cta"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="py-8 text-center text-sm text-white" style={{ background: "var(--brand-primary)" }}>
        <SocialIcons social={siteData.social} className="mb-3 justify-center text-white" />
        © {new Date().getFullYear()} {name}. {siteData.footerCredit ?? "Built with Tomora"}
      </footer>
    </BrandStyle>
  );
}
