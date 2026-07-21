"use client";

import { ArrowRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, SocialIcons,
  heading, subheading, servicesOf, navItems, VideoLinkGrid, CustomSections, OrderedSections,
} from "./shared";
import { ResultsSection } from "./ResultsSection";

function DarkButton({ href = "#", children }: { href?: string; children: React.ReactNode }) {
  return <a href={href} className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90">{children}</a>;
}
function Marquee({ text, bg }: { text: string; bg: string }) {
  return (
    <div className="overflow-hidden py-3 text-sm font-bold uppercase tracking-wide text-neutral-900" style={{ background: bg }}>
      <div className="flex whitespace-nowrap">
        {[0, 1, 2, 3].map((i) => <span key={i} className="px-4">{text} ·</span>)}
      </div>
    </div>
  );
}

const FALLBACK_SERVICES = [
  { title: "Creative Content Creation", description: "On-brand content that stops the scroll and builds trust." },
  { title: "Business Consultation", description: "Clear strategy and systems to help you scale with ease." },
  { title: "Social Media Solutions", description: "Done-for-you social that grows your audience and sales." },
];

export function Handle({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Studio";
  const services = servicesOf(siteData, FALLBACK_SERVICES);
  const logos = siteData.clientLogos || [];
  const aboutBtn = siteData.sectionButtons?.about || {};
  const processBtn = siteData.sectionButtons?.process || {};
  const ctaBtn = siteData.sectionButtons?.cta || {};
  const col = (k: string, fb: string) => siteData.sectionColors?.[k] || fb;

  const blocks: Record<string, React.ReactNode> = {
    beforeAfter: <ResultsSection siteData={siteData} brandColor={brandColor} />,
    hero: (
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2">
        <Img src={siteData.heroImage} className="mx-auto aspect-[4/5] w-full max-w-md rounded-2xl object-cover" />
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl">{siteData.heroHeadline}</h1>
          <p className="mt-5 max-w-md text-black/60">{siteData.heroSubtext}</p>
          {siteData.ctaText ? <div className="mt-7"><DarkButton href={siteData.ctaHref || "#about"}>{siteData.ctaText}</DarkButton></div> : null}
        </div>
      </section>
    ),
    marquee: <Marquee text={heading(siteData, "marquee", "We manage it all · You reap the benefits")} bg={col("marquee", "var(--brand-primary)")} />,
    about: (
      <section id="about" style={{ background: col("about", "#FCE7EE") }}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold uppercase leading-tight">{heading(siteData, "about", "Helping your business achieve its full potential")}</h2>
            <p className="mt-4 leading-relaxed text-black/60">{subheading(siteData, "about", "")}</p>
            {aboutBtn.text ? <a href={aboutBtn.url?.trim() || "#services"} className="mt-5 inline-block text-sm font-semibold underline underline-offset-4">{aboutBtn.text}</a> : null}
          </div>
          <Img src={siteData.sectionImages?.about} className="aspect-[4/3] w-full rounded-2xl object-cover" />
        </div>
      </section>
    ),
    services: (
      <section id="services" style={{ background: col("services", "#FBDDE8") }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-6 sm:grid-cols-2">
            <Img src={siteData.sectionImages?.services} className="aspect-square w-full rounded-2xl object-cover" />
            {services.slice(0, 3).map((s, i) => (
              <div key={i} className="flex flex-col justify-center">
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-black/60">{s.description}</p>
                <a href="#videos" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Learn more <ArrowRight className="h-4 w-4" /></a>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    logos: logos.length === 0 ? null : (
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-2xl font-bold text-black/70">
          {logos.map((l) => l.image ? <Img key={l.id} src={l.image} className="h-8 w-auto object-contain" /> : <span key={l.id}>{l.name}</span>)}
        </div>
      </section>
    ),
    process: (
      <section id="process" className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">{heading(siteData, "process", "Inspire · Create · Elevate")}</h2>
          <p className="mt-4 max-w-md text-black/60">{subheading(siteData, "process", "")}</p>
          {processBtn.text ? <a href={processBtn.url?.trim() || "#videos"} className="mt-5 inline-block text-sm font-semibold underline underline-offset-4">{processBtn.text}</a> : null}
        </div>
        <Img src={siteData.sectionImages?.process} className="aspect-[4/3] w-full rounded-2xl object-cover" />
      </section>
    ),
    videos: (
      <section id="videos" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-extrabold sm:text-4xl">{heading(siteData, "videos", "Watch Our Work")}</h2>
        <p className="mt-2 max-w-xl text-black/60">{subheading(siteData, "videos", "")}</p>
        <div className="mt-8"><VideoLinkGrid videos={siteData.videoLinks} /></div>
      </section>
    ),
    cta: (
      <section id="cta" style={{ background: col("cta", "#FCE7EE") }}>
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{heading(siteData, "cta", "Ready to get started?")}</h2>
          <p className="mx-auto mt-3 max-w-md text-black/60">{subheading(siteData, "cta", "")}</p>
          <div className="mt-6"><DarkButton href={ctaBtn.url?.trim() || (siteData.email ? `mailto:${siteData.email}` : "#")}>{ctaBtn.text || "Book a Call"}</DarkButton></div>
        </div>
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {navItems(siteData, [["Home", "#"], ["About", "#about"], ["Services", "#services"], ["Portfolio", "#videos"], ["Contact", "#cta"], ["Blog", "#"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
          <DarkButton href="#cta">Start Here</DarkButton>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "marquee", "about", "services", "logos", "process", "beforeAfter", "videos", "cta"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="border-t border-black/5 py-8 text-center text-sm text-black/40">
        <SocialIcons social={siteData.social} className="mb-3 justify-center" />
        © {new Date().getFullYear()} {name}. {siteData.footerCredit ?? "Built with Tomora"}
      </footer>
    </BrandStyle>
  );
}
