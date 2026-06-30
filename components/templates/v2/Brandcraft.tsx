"use client";

import { ArrowUpRight, ArrowRight, Quote, Compass, PenTool, Hammer, TrendingUp, Megaphone, Layout, MousePointer2, ShoppingBag, Code2, Clapperboard } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, BrandButton, Img,
  heading, subheading, servicesOf, testimonialsOf, navItems, SocialIcons, CustomSections, OrderedSections,
} from "./shared";

const DOTS = { backgroundImage: "radial-gradient(rgba(0,0,0,0.07) 1px, transparent 1px)", backgroundSize: "22px 22px" } as React.CSSProperties;
const PROCESS_ICONS = [Compass, PenTool, Hammer, TrendingUp];
const EXPERTISE_ICONS = [Megaphone, Layout, MousePointer2, ShoppingBag, Code2, Clapperboard];

const FALLBACK_PROCESS = [
  { title: "Discover", description: "We dig into your goals, audience and market to set the right direction." },
  { title: "Design", description: "We shape the brand and interface — look, feel and every detail." },
  { title: "Build", description: "We turn the design into a fast, responsive, production-ready site." },
  { title: "Evolve", description: "We measure, refine and keep improving long after launch." },
];
const FALLBACK_EXPERTISE = [
  { title: "Brand Strategy", description: "Positioning, messaging and identity that set you apart." },
  { title: "Web Design", description: "Beautiful, conversion-focused websites." },
  { title: "UX / UI Design", description: "Intuitive product interfaces people love." },
  { title: "E-commerce", description: "Stores that turn browsers into customers." },
  { title: "Development", description: "Robust, scalable builds with clean code." },
  { title: "Content & Motion", description: "Copy, photography and motion that bring it to life." },
];

export function Brandcraft({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Brandcraft";
  const logos = siteData.clientLogos || [];
  const chips = (siteData.skills || []).map((s) => s.name).filter(Boolean);
  const process = servicesOf(siteData, FALLBACK_PROCESS);
  const expertise = siteData.eduFeatures?.length ? siteData.eduFeatures : FALLBACK_EXPERTISE;
  const projects = siteData.portfolioItems || [];
  const aboutCardBg = siteData.sectionColors?.about || "#0B0B0C";
  const expertiseBg = siteData.sectionColors?.expertise || "#0B0B0C";
  const ctaBg = siteData.sectionColors?.cta || "#0B0B0C";
  const projBtn = siteData.sectionButtons?.projects || {};
  const ctaBtn = siteData.sectionButtons?.cta || {};
  const link = (u?: string) => (u || "").trim();

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <section style={DOTS}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:py-20 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold uppercase leading-[1.02] tracking-tight sm:text-6xl">{siteData.heroHeadline}</h1>
            <p className="mt-5 max-w-md text-black/60">{siteData.heroSubtext}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              {siteData.ctaText ? <BrandButton as="a" href={siteData.ctaHref || "#cta"} className="rounded-full">{siteData.ctaText} <ArrowUpRight className="h-4 w-4" /></BrandButton> : null}
              <a href="#projects" className="text-sm font-semibold underline-offset-4 hover:underline">See our work</a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <Img src={siteData.heroImage} className="aspect-[4/5] w-full rounded-2xl object-cover" />
            {(siteData.heroStatValue || siteData.heroStatLabel) ? (
              <div className="absolute bottom-4 left-4 rounded-xl bg-black/85 px-4 py-2.5 text-white backdrop-blur">
                {siteData.heroStatLabel ? <p className="text-[10px] uppercase tracking-widest text-white/55">{siteData.heroStatLabel}</p> : null}
                {siteData.heroStatValue ? <p className="text-sm font-bold">{siteData.heroStatValue}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    ),
    logos: logos.length === 0 ? null : (
      <section className="border-y border-black/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-7 text-lg font-bold uppercase tracking-wide text-black/35">
          {logos.map((l) => l.image ? <Img key={l.id} src={l.image} className="h-7 w-auto object-contain opacity-70" /> : <span key={l.id}>{l.name}</span>)}
        </div>
      </section>
    ),
    about: (
      <section id="about" className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{heading(siteData, "about", "Meet Your Design Partners")}</h2>
            <p className="mt-4 leading-relaxed text-black/60">{subheading(siteData, "about", "")}</p>
            {chips.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {chips.map((c, i) => <span key={i} className="rounded-full border border-black/15 px-4 py-1.5 text-sm font-medium">{c}</span>)}
              </div>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-3xl p-2" style={{ background: aboutCardBg }}>
            <Img src={siteData.sectionImages?.about} className="aspect-[4/3] w-full rounded-2xl object-cover grayscale" />
          </div>
        </div>
      </section>
    ),
    process: (
      <section id="process" className="bg-[#F6F5F3]" style={DOTS}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{heading(siteData, "process", "Let us share our latest thinking")}</h2>
          <p className="mt-3 max-w-xl text-black/55">{subheading(siteData, "process", "")}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {process.map((s, i) => {
              const Icon = PROCESS_ICONS[i % PROCESS_ICONS.length];
              return (
                <div key={i} className={`rounded-3xl border border-dashed border-black/20 bg-white p-7 shadow-sm ${i % 2 ? "sm:mt-10" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white"><Icon className="h-5 w-5" /></span>
                    <span className="text-3xl font-extrabold text-black/10">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-black/55">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
    expertise: (
      <section id="expertise" className="text-white" style={{ background: expertiseBg }}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          {siteData.sectionEyebrows?.expertise ? <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{siteData.sectionEyebrows.expertise}</span> : null}
          <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{heading(siteData, "expertise", "We design memorable experiences")}</h2>
          <p className="mt-3 max-w-xl text-white/60">{subheading(siteData, "expertise", "")}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {expertise.map((s, i) => {
              const Icon = EXPERTISE_ICONS[i % EXPERTISE_ICONS.length];
              return (
                <div key={i} className="rounded-2xl border border-white/15 p-6">
                  <Icon className="h-7 w-7 text-white/80" strokeWidth={1.5} />
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
    projects: projects.length === 0 ? null : (
      <section id="projects" className="mx-auto max-w-6xl px-5 py-16">
        {siteData.sectionEyebrows?.projects ? <span className="text-xs font-semibold uppercase tracking-widest text-black/40">{siteData.sectionEyebrows.projects}</span> : null}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{heading(siteData, "projects", "Explore our most recent projects")}</h2>
          {projBtn.text ? (
            <a href={link(projBtn.url) || "#"} {...(link(projBtn.url) ? { target: "_blank", rel: "noreferrer" } : {})} className="inline-flex items-center gap-1 rounded-full border border-black/20 px-5 py-2.5 text-sm font-semibold">{projBtn.text} <ArrowRight className="h-4 w-4" /></a>
          ) : null}
        </div>
        <p className="mt-3 max-w-xl text-black/55">{subheading(siteData, "projects", "")}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <a key={p.id} href={p.linkUrl || "#"} className="group block overflow-hidden rounded-2xl border border-black/10">
              <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100"><Img src={p.image} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /></div>
              <div className="p-5">
                {p.category ? <span className="text-xs font-semibold uppercase tracking-wide text-black/40">{p.category}</span> : null}
                <h3 className="mt-1 flex items-start justify-between gap-2 font-semibold">{p.title}<ArrowUpRight className="h-4 w-4 shrink-0 opacity-30 transition group-hover:opacity-100" /></h3>
                {p.description ? <p className="mt-1 text-sm text-black/55">{p.description}</p> : null}
              </div>
            </a>
          ))}
        </div>
      </section>
    ),
    testimonials: (testimonialsOf(siteData).length === 0) ? null : (
      <section className="bg-[#F6F5F3]" style={DOTS}>
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{heading(siteData, "testimonials", "Here's what people say about our work")}</h2>
          {testimonialsOf(siteData).slice(0, 1).map((t, i) => (
            <figure key={t.id || i} className="mt-10">
              <Img src={t.image || `https://picsum.photos/seed/bc-rev${i}/96`} className="mx-auto h-16 w-16 rounded-full object-cover grayscale" />
              <Quote className="mx-auto mt-4 h-7 w-7 text-black/20" />
              <blockquote className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-black/70">{t.quote}</blockquote>
              <figcaption className="mt-4"><p className="font-bold uppercase tracking-wide">{t.name}</p>{t.role ? <p className="text-sm text-black/45">{t.role}</p> : null}</figcaption>
            </figure>
          ))}
          {testimonialsOf(siteData).length > 1 ? (
            <div className="mt-8 flex justify-center gap-2">
              {testimonialsOf(siteData).map((t, i) => <span key={t.id || i} className={`h-2 w-2 rounded-full ${i === 0 ? "bg-black" : "bg-black/20"}`} />)}
            </div>
          ) : null}
        </div>
      </section>
    ),
    cta: (
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="rounded-3xl px-6 py-14 text-center text-white sm:px-12" style={{ background: ctaBg }}>
          <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{heading(siteData, "cta", "Let's start designing your project")}</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">{subheading(siteData, "cta", "")}</p>
          <a href={link(ctaBtn.url) || (siteData.email ? `mailto:${siteData.email}` : "#")} {...(link(ctaBtn.url) ? { target: "_blank", rel: "noreferrer" } : {})}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black">
            {ctaBtn.text || "Start a message"} <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-black uppercase tracking-wide" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">
            {navItems(siteData, [["Home", "#"], ["About", "#about"], ["Process", "#process"], ["Services", "#expertise"], ["Work", "#projects"], ["Contact", "#cta"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
          {siteData.ctaText ? <BrandButton as="a" href={siteData.ctaHref || "#cta"} className="rounded-full px-4 py-2 text-xs">{siteData.ctaText}</BrandButton> : null}
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "logos", "about", "process", "expertise", "projects", "testimonials", "cta"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center">
          <div>
            <Brandmark siteData={siteData} name={name} className="text-lg font-black uppercase tracking-wide" />
            {siteData.email ? <p className="mt-2 text-sm text-black/50">{siteData.email}</p> : null}
            {siteData.phone ? <p className="text-sm text-black/50">{siteData.phone}</p> : null}
          </div>
          <SocialIcons social={siteData.social} circle className="text-black/60" />
        </div>
        <div className="border-t border-black/5 py-5 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
