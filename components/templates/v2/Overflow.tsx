"use client";

import { Check, Quote, ArrowRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, BrandButton, SocialIcons,
  heading, subheading, servicesOf, testimonialsOf, navItems, VideoLinkGrid, CustomSections, OrderedSections,
} from "./shared";
import { ResultsSection } from "./ResultsSection";

const FALLBACK_OFFERS = [
  { title: "1:1 Coaching", description: "Private mentorship to help you heal money blocks and scale with alignment." },
  { title: "Courses", description: "Self-paced digital experiences to elevate your mindset, energy and income." },
  { title: "Journals & Resources", description: "Beautifully designed tools to ground your growth." },
  { title: "Free Resources", description: "Downloads, trainings and more to begin your journey into overflow." },
];

export function Overflow({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Your Name";
  const overlay = siteData.heroOverlayColor || "#1A0808";
  const points = (siteData.skills || []).map((s) => s.name).filter(Boolean);
  const inside = siteData.eduFeatures || [];
  const offers = servicesOf(siteData, FALLBACK_OFFERS);
  const offerBtn = siteData.sectionButtons?.offer || {};
  const ctaBtn = siteData.sectionButtons?.cta || {};
  const col = (k: string, fb: string) => siteData.sectionColors?.[k] || fb;

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <section className="relative">
        <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to bottom, ${overlay}55, ${overlay}CC)` }} />
        <div className="relative mx-auto flex min-h-[85vh] max-w-4xl flex-col items-center justify-center px-5 py-24 text-center text-white">
          <p className="font-serif text-lg italic opacity-90">{name}</p>
          <h1 className="mt-3 font-serif text-5xl font-medium lowercase leading-tight sm:text-7xl">{siteData.heroHeadline}</h1>
          {siteData.ctaText ? <a href={siteData.ctaHref || "#offer"} className="mt-8 rounded-full border border-white/70 px-8 py-3 font-serif text-sm italic">{siteData.ctaText}</a> : null}
        </div>
      </section>
    ),
    about: (
      <section id="about" className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-0 px-5 py-16 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
          <div className="grid items-start gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-serif text-5xl font-medium lowercase" style={{ color: "var(--brand-primary)" }}>{heading(siteData, "about", "about me")}</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-black/70">{subheading(siteData, "about", "")}</p>
            </div>
            <Img src={siteData.sectionImages?.about} className="aspect-square w-full rounded-2xl object-cover" />
          </div>
          {points.length > 0 && (
            <div className="mt-8 rounded-2xl p-7 text-white lg:mt-0" style={{ background: col("about", "#8C2B22") }}>
              <p className="font-serif text-xl italic opacity-90">I'm here for…</p>
              <ul className="mt-4 space-y-3">
                {points.map((p, i) => <li key={i} className="flex gap-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0" />{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      </section>
    ),
    offer: (
      <section id="offer" style={{ background: col("offer", "#F3D9DE") }}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <Img src={siteData.sectionImages?.offer} className="mx-auto aspect-[3/4] w-full max-w-[300px] rounded-2xl object-cover" />
          <div>
            <h2 className="font-serif text-4xl font-medium lowercase" style={{ color: "var(--brand-primary)" }}>{heading(siteData, "offer", "The Signature Offer")}</h2>
            <p className="mt-4 leading-relaxed text-black/70">{subheading(siteData, "offer", "")}</p>
            {inside.length > 0 && (
              <ul className="mt-5 space-y-2">
                {inside.map((f) => <li key={f.id} className="flex gap-2 text-sm text-black/70"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand-primary)" }} />{f.title}</li>)}
              </ul>
            )}
            {offerBtn.text ? <BrandButton as="a" href={offerBtn.url?.trim() || (siteData.email ? `mailto:${siteData.email}` : "#")} className="mt-6 rounded-full">{offerBtn.text}</BrandButton> : null}
          </div>
        </div>
      </section>
    ),
    services: (
      <section id="services" className="text-white" style={{ background: col("services", "#7C2119") }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-4xl font-medium lowercase">{heading(siteData, "services", "what i offer")}</h2>
          <p className="mt-3 max-w-md text-white/70">{subheading(siteData, "services", "")}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {offers.map((s, i) => (
              <div key={i} className="rounded-2xl bg-white/95 p-6 text-neutral-900">
                <h3 className="text-lg font-bold" style={{ color: "var(--brand-primary)" }}>{s.title}</h3>
                <p className="mt-2 text-sm text-black/60">{s.description}</p>
                <a href="#cta" className="mt-3 inline-block rounded-full px-5 py-2 text-xs font-semibold text-white" style={{ background: "var(--brand-primary)" }}>Learn more</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    results: (testimonialsOf(siteData).length === 0) ? null : (
      <section id="results" className="text-white" style={{ background: col("results", "#2A0C0A") }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center font-serif text-3xl font-medium italic">{heading(siteData, "results", "Results That Matter")}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonialsOf(siteData).slice(0, 3).map((t, i) => (
              <figure key={t.id || i} className="rounded-2xl bg-white/95 p-6 text-neutral-900">
                <Quote className="h-6 w-6" style={{ color: "var(--brand-primary)" }} />
                <blockquote className="mt-3 text-sm leading-relaxed text-black/70">{t.quote}</blockquote>
                <figcaption className="mt-4 text-xs font-bold uppercase tracking-wide">{t.name}{t.role ? ` · ${t.role}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    ),
    beforeAfter: <ResultsSection siteData={siteData} brandColor={brandColor} />,
    videos: (
      <section id="videos" className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-4xl font-medium lowercase" style={{ color: "var(--brand-primary)" }}>{heading(siteData, "videos", "Watch")}</h2>
          <p className="mt-2 max-w-xl text-black/60">{subheading(siteData, "videos", "")}</p>
          <div className="mt-8"><VideoLinkGrid videos={siteData.videoLinks} /></div>
        </div>
      </section>
    ),
    cta: (
      <section id="cta" className="text-white" style={{ background: col("cta", "#5A1712") }}>
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-16 lg:grid-cols-2">
          <h2 className="font-serif text-4xl font-medium lowercase sm:text-5xl">{heading(siteData, "cta", "Ready For Your Next Expansion?")}</h2>
          <div>
            <p className="text-white/75">{subheading(siteData, "cta", "")}</p>
            <a href={ctaBtn.url?.trim() || (siteData.email ? `mailto:${siteData.email}` : "#")} className="mt-6 inline-block rounded-full bg-white px-8 py-3 font-serif text-sm italic" style={{ color: col("cta", "#5A1712") }}>{ctaBtn.text || "Apply to work together"}</a>
            <div className="mt-6"><SocialIcons social={siteData.social} className="text-white/70" /></div>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 text-white">
          <Brandmark siteData={siteData} name={name} className="font-serif text-xl font-medium" />
          <nav className="hidden gap-6 text-sm text-white/80 lg:flex">
            {navItems(siteData, [["Home", "#"], ["About", "#about"], ["Offer", "#offer"], ["Work", "#videos"], ["Results", "#results"], ["Contact", "#cta"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-white">{l}</a>)}
          </nav>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "about", "offer", "services", "results", "beforeAfter", "videos", "cta"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="py-8 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. {siteData.footerCredit ?? "Built with Tomora"}</footer>
    </BrandStyle>
  );
}
