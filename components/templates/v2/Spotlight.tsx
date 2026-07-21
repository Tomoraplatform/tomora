"use client";

import { Play, Film, Mail, Linkedin, Instagram } from "lucide-react";
import type { SiteData } from "@/lib/database.types";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, BrandButton,
  heading, subheading, servicesOf, navItems, CustomSections, OrderedSections,
} from "./shared";
import { ResultsSection } from "./ResultsSection";

/** TikTok glyph (Lucide has no brand icon for it). */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3c.3 2.1 1.5 3.4 3.5 3.6v2.4c-1.2.1-2.4-.2-3.5-.8v5.9c0 3.6-2.9 6-6 6-3.3 0-5.5-2.4-5.5-5.3 0-3 2.3-5.2 5.3-5.2.3 0 .6 0 .9.1v2.6c-.3-.1-.6-.2-.9-.2-1.4 0-2.5 1.1-2.5 2.6 0 1.4 1 2.6 2.6 2.6 1.5 0 2.6-1.1 2.6-2.9V3h3z" />
    </svg>
  );
}

const FALLBACK_SKILLS = ["Brand & Visual Design", "UI / UX Design", "Photography", "Video Editing", "Art Direction"];
const FALLBACK_SERVICES = [
  { title: "Brand Identity", description: "Logos, visual systems and brand guidelines that give you a distinctive, consistent presence." },
  { title: "Web & Product Design", description: "Beautiful, conversion-focused websites and interfaces designed around your audience." },
  { title: "Photo & Video", description: "Original photography and edited video content ready for your campaigns and socials." },
];

function splitHeading(text: string): readonly [string, string] {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return [text, ""] as const;
  return [parts[0], parts.slice(1).join(" ")] as const;
}

export function Spotlight({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Your Name";
  const eyebrow = siteData.sectionEyebrows?.hero || "My name is";
  const roleLabel = siteData.heroStatLabel || "What I Do";
  const role = siteData.heroStatValue || "Designer";
  const skills = (siteData.skills?.map((s) => s.name).filter(Boolean) as string[] | undefined);
  const skillList = skills?.length ? skills : FALLBACK_SKILLS;
  const skillsTitle = siteData.sectionText?.skillsTitle || "My Skills";
  const aboutBg = siteData.sectionColors?.about || "var(--brand-primary)";
  const funfactBg = siteData.sectionColors?.funfact || "";
  const footerBg = siteData.sectionColors?.portfolio || "";
  const expPhotos = (siteData.experiencePhotos || []).filter((p) => p.image);
  const photos = (siteData.galleryPhotos || []).filter((p) => p.image);
  const videos = siteData.galleryVideos || [];
  const services = servicesOf(siteData, FALLBACK_SERVICES);
  const footerImg = siteData.sectionImages?.portfolio;

  // "Contact Me" buttons fall back to the owner's email when no explicit link is set.
  const contactLink = (url?: string) => {
    const u = (url || "").trim();
    if (u) return u;
    return siteData.email ? `mailto:${siteData.email}` : "#";
  };
  const expBtn = siteData.sectionButtons?.experience || {};
  const svcBtn = siteData.sectionButtons?.services || {};

  const blocks: Record<string, React.ReactNode> = {
    beforeAfter: <ResultsSection siteData={siteData} brandColor={brandColor} />,
    hero: (
      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(260px,340px)_1fr]">
          <div className="text-center lg:text-left">
            <p className="text-2xl font-bold text-black/90 sm:text-3xl">{eyebrow}</p>
            <h1 className="mt-1 break-words text-5xl font-extrabold uppercase leading-none sm:text-6xl" style={{ color: "var(--brand-primary)" }}>{name}</h1>
            {siteData.heroSubtext ? <p className="mt-3 text-black/60">{siteData.heroSubtext}</p> : null}
            {siteData.ctaText ? (
              <BrandButton as="a" href={contactLink(siteData.ctaHref)} className="mt-5">{siteData.ctaText}</BrandButton>
            ) : null}
          </div>
          <div className="order-first lg:order-none">
            <Img src={siteData.heroImage} className="mx-auto aspect-[3/4] w-full max-w-[340px] rounded-xl object-cover" />
          </div>
          <div className="text-center lg:text-right">
            <p className="text-2xl font-bold text-black/90 sm:text-3xl">{roleLabel}</p>
            <p className="mt-1 break-words text-5xl font-extrabold leading-none sm:text-6xl" style={{ color: "var(--brand-primary)" }}>{role}</p>
          </div>
        </div>
      </section>
    ),
    about: (
      <section className="mx-auto max-w-6xl px-5 pb-4">
        <div className="grid gap-8 rounded-3xl p-8 sm:p-10 lg:grid-cols-2 lg:gap-12" style={{ background: aboutBg }}>
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{heading(siteData, "about", "About Me")}</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-white/85">{subheading(siteData, "about", "")}</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{skillsTitle}</h2>
            <ul className="mt-4 space-y-3">
              {skillList.map((s, i) => (
                <li key={i} className="flex items-center gap-3 text-white/90">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    ),
    funfact: (
      <section className="px-5 py-14" style={funfactBg ? { background: funfactBg } : undefined}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-bold sm:text-2xl">{heading(siteData, "funfact", "Fun fact About Me")}</h2>
          <p className="mt-4 leading-relaxed text-black/60">{subheading(siteData, "funfact", "")}</p>
        </div>
      </section>
    ),
    experience: (
      <section id="experience" className="mx-auto max-w-6xl px-5 py-6">
        <div className="grid items-center gap-10 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              {(() => {
                const [a, b] = splitHeading(heading(siteData, "experience", "My Experience"));
                return (<><span className="font-serif italic text-black/80">{a}{b ? " " : ""}</span>{b ? <span style={{ color: "var(--brand-primary)" }}>{b}</span> : null}</>);
              })()}
            </h2>
            <p className="mt-4 leading-relaxed text-black/60">{subheading(siteData, "experience", "")}</p>
            {expBtn.text ? <BrandButton as="a" href={contactLink(expBtn.url)} className="mt-6">{expBtn.text}</BrandButton> : null}
          </div>
          <div className="relative mx-auto h-[320px] w-full max-w-sm">
            {expPhotos[1]?.image ? <Img src={expPhotos[1].image} className="absolute right-0 top-8 h-[260px] w-[58%] rounded-xl object-cover shadow-lg" /> : null}
            {expPhotos[0]?.image ? <Img src={expPhotos[0].image} className="absolute left-0 top-0 h-[260px] w-[58%] rounded-xl object-cover shadow-xl ring-4 ring-white" /> : null}
            {expPhotos.length === 0 ? <div className="h-full w-full rounded-xl bg-black/5" /> : null}
          </div>
        </div>
      </section>
    ),
    services: (
      <section id="services" className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--brand-primary)" }}>{heading(siteData, "services", "Services")}</h2>
        <div className="mt-8 divide-y divide-black/10 border-y border-black/10">
          {services.map((s, i) => (
            <div key={i} className="grid gap-2 py-6 sm:grid-cols-[200px_1fr] sm:gap-8">
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="text-black/60">{s.description}</p>
            </div>
          ))}
        </div>
        {svcBtn.text ? <div className="mt-8"><BrandButton as="a" href={contactLink(svcBtn.url)}>{svcBtn.text}</BrandButton></div> : null}
      </section>
    ),
    photos: (
      <section id="photos" className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="mb-6 text-3xl font-bold sm:text-4xl" style={{ color: "var(--brand-primary)" }}>{heading(siteData, "photos", "My Photos")}</h2>
        {photos.length ? (
          <div className="columns-2 [column-gap:1rem] lg:columns-3">
            {photos.map((p) => (
              <figure key={p.id} className="mb-4 break-inside-avoid overflow-hidden rounded-xl">
                <Img src={p.image} className="w-full object-cover" />
                {p.name ? <figcaption className="mt-1 text-xs text-black/50">{p.name}</figcaption> : null}
              </figure>
            ))}
          </div>
        ) : <EmptyGrid />}
      </section>
    ),
    videos: (
      <section id="videos" className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6 flex flex-wrap items-baseline gap-3">
          <h2 className="text-3xl font-bold sm:text-4xl">{heading(siteData, "videos", "Videography")}</h2>
          <span className="font-serif text-xl italic" style={{ color: "var(--brand-primary)" }}>{subheading(siteData, "videos", "Contents I Created")}</span>
        </div>
        {videos.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-xl bg-black/5">
                {v.video ? (
                  <video src={v.video} poster={v.thumbnail || undefined} controls playsInline className="aspect-[3/4] w-full bg-black object-cover" />
                ) : v.thumbnail ? (
                  <div className="relative aspect-[3/4] w-full">
                    <Img src={v.thumbnail} className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-black"><Play className="h-5 w-5 translate-x-0.5 fill-current" /></span>
                    </span>
                  </div>
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center text-black/30"><Film className="h-8 w-8" /></div>
                )}
                {v.title ? <p className="px-2 py-1.5 text-xs text-black/60">{v.title}</p> : null}
              </div>
            ))}
          </div>
        ) : <EmptyGrid />}
      </section>
    ),
    portfolio: (
      <section className="px-5 py-16" style={footerBg ? { background: footerBg } : undefined}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-6xl font-extrabold uppercase leading-none tracking-tight sm:text-8xl" style={{ color: "var(--brand-primary)" }}>{heading(siteData, "portfolio", "Portfolio")}</h2>
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-lg font-semibold sm:text-2xl">{name}</p>
            {footerImg ? <Img src={footerImg} className="h-28 w-24 rounded-xl object-cover sm:h-36 sm:w-32" /> : <div className="h-28 w-24 rounded-xl bg-black/10 sm:h-36 sm:w-32" />}
            <p className="text-lg font-semibold sm:text-2xl">{role}</p>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-xl font-black uppercase tracking-wide" />
          <nav className="hidden gap-6 text-sm font-medium text-black/70 sm:flex">
            {navItems(siteData, [["Home", "#"], ["Experience", "#experience"], ["Service", "#services"], ["Photos", "#photos"], ["Videos", "#videos"]]).map(([l, h]) => (
              <a key={l} href={h} className="hover:text-black">{l}</a>
            ))}
          </nav>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "about", "funfact", "experience", "services", "beforeAfter", "photos", "videos", "portfolio"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />
      <footer className="border-t border-black/5 py-8 text-center text-sm text-black/40">
        <FooterSocials siteData={siteData} />
        © {new Date().getFullYear()} {name}. {siteData.footerCredit ?? "Built with Tomora"}
      </footer>
    </BrandStyle>
  );
}

/** Footer contact row: email + LinkedIn + Instagram + TikTok (only the ones the owner fills in). */
function FooterSocials({ siteData }: { siteData: SiteData }) {
  const link = (url: string | undefined, base: string) => {
    const u = (url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return base + u.replace(/^@/, "");
  };
  const items = [
    siteData.email ? { href: `mailto:${siteData.email}`, Icon: Mail, label: "Email" } : null,
    link(siteData.social?.linkedin, "https://linkedin.com/in/") ? { href: link(siteData.social?.linkedin, "https://linkedin.com/in/"), Icon: Linkedin, label: "LinkedIn" } : null,
    link(siteData.social?.instagram, "https://instagram.com/") ? { href: link(siteData.social?.instagram, "https://instagram.com/"), Icon: Instagram, label: "Instagram" } : null,
    link(siteData.social?.tiktok, "https://tiktok.com/@") ? { href: link(siteData.social?.tiktok, "https://tiktok.com/@"), Icon: TikTokIcon, label: "TikTok" } : null,
  ].filter(Boolean) as { href: string; Icon: (p: { className?: string }) => JSX.Element; label: string }[];

  if (!items.length) return null;
  return (
    <div className="mb-3 flex justify-center gap-3">
      {items.map(({ href, Icon, label }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/60 transition hover:border-black/20 hover:text-black">
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

function EmptyGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] rounded-xl bg-black/5" />)}
    </div>
  );
}
