"use client";

import { HandHeart, GraduationCap, Baby, Users, Quote, Heart, ChevronDown, ArrowRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, SocialIcons, BrandButton, Img,
  heading, subheading, servicesOf, testimonialsOf, navItems, CustomSections, OrderedSections,
} from "./shared";
import { DonationSection } from "./DonationSection";

const SERVICE_ICONS = [HandHeart, GraduationCap, Baby, Users];
const FALLBACK_SERVICES = [
  { title: "Help & Support", description: "Programs that change lives across our communities every day." },
  { title: "Education", description: "Schooling and learning opportunities for every child." },
  { title: "Adoption", description: "Finding loving homes for children who need them most." },
  { title: "Volunteering", description: "Join hands with our field teams on the ground." },
];

export function HelpingHands({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Open Heart";
  const impact = (siteData.impactImages || []).filter((i) => i.image).slice(0, 4);
  const services = servicesOf(siteData, FALLBACK_SERVICES);
  const logos = siteData.clientLogos || [];
  const helpBtn = siteData.sectionButtons?.helping || {};
  const volBtn = siteData.sectionButtons?.volunteers || {};
  const volColor = siteData.sectionColors?.volunteers || "var(--brand-primary)";
  const volEyebrow = siteData.sectionEyebrows?.volunteers;
  const svcTitle = siteData.sectionTitles?.services;
  const year = new Date().getFullYear();
  const link = (u?: string) => (u || "").trim();

  const blocks: Record<string, React.ReactNode> = {
    donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
    hero: (
      <section className="bg-[#F7F5F2]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
          <div className="grid items-end gap-8 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <h1 className="text-3xl font-extrabold uppercase leading-[1.1] tracking-tight sm:text-4xl">{siteData.heroHeadline}</h1>
            </div>
            <div className="order-1 lg:order-2">
              <Img src={siteData.heroImage} className="aspect-[5/4] w-full object-cover grayscale" />
              <div className="mt-4 flex flex-wrap items-center gap-5">
                <BrandButton as="a" href={siteData.ctaHref || "#donation"}>{siteData.ctaText || "Donate Now!"} <ChevronDown className="h-4 w-4" /></BrandButton>
                {(siteData.heroStatLabel || siteData.heroStatValue) ? (
                  <div>
                    {siteData.heroStatLabel ? <p className="text-[11px] font-semibold uppercase tracking-wide text-black/50">{siteData.heroStatLabel}</p> : null}
                    {siteData.heroStatValue ? <p className="text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>{siteData.heroStatValue}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    ),
    helping: (
      <section id="helping" className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            {(impact.length ? impact : [0, 1, 2, 3].map((i) => ({ id: `ph${i}`, image: "", name: "" }))).map((im) => (
              im.image
                ? <Img key={im.id} src={im.image} className="aspect-square w-full object-cover grayscale" />
                : <div key={im.id} className="aspect-square w-full bg-black/10" />
            ))}
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-tight">{heading(siteData, "helping", "Give a helping hand to those who need it!")}</h2>
            <p className="mt-4 leading-relaxed text-black/60">{subheading(siteData, "helping", "")}</p>
            {helpBtn.text ? (
              <a href={link(helpBtn.url) || "#"} {...(link(helpBtn.url) ? { target: "_blank", rel: "noreferrer" } : {})}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
                {helpBtn.text} <ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </section>
    ),
    services: (
      <section id="services" className="mx-auto max-w-6xl px-5 pb-16">
        {svcTitle ? <h2 className="mb-8 text-3xl font-bold">{svcTitle}</h2> : null}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
            {services.map((s, i) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <div key={i}>
                  <Icon className="h-9 w-9" style={{ color: "var(--brand-primary)" }} strokeWidth={1.5} />
                  <h3 className="mt-3 text-sm font-bold uppercase tracking-wide">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-black/55">{s.description}</p>
                </div>
              );
            })}
          </div>
          {siteData.sectionImages?.services ? (
            <Img src={siteData.sectionImages.services} className="mx-auto w-full max-w-md object-contain" />
          ) : null}
        </div>
      </section>
    ),
    volunteers: (
      <section className="grid md:grid-cols-2">
        <Img src={siteData.sectionImages?.volunteers} className="h-72 w-full object-cover grayscale md:h-auto" />
        <div className="relative overflow-hidden px-6 py-12 text-white md:px-12" style={{ background: volColor }}>
          {volEyebrow ? <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{volEyebrow}</span> : null}
          <h2 className="mt-2 max-w-md text-3xl font-bold uppercase leading-tight">{heading(siteData, "volunteers", "We Need Volunteers in South Africa")}</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed opacity-90">{subheading(siteData, "volunteers", "")}</p>
          {logos.length ? (
            <div className="mt-6 flex max-w-md flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium uppercase tracking-wide opacity-70">
              {logos.map((l) => <span key={l.id}>{l.name}</span>)}
            </div>
          ) : null}
          {volBtn.text ? (
            <>
              <a href={link(volBtn.url) || "#"} {...(link(volBtn.url) ? { target: "_blank", rel: "noreferrer" } : {})}
                className="mt-6 inline-block rounded-md bg-white px-6 py-3 text-sm font-bold uppercase md:hidden" style={{ color: volColor }}>
                {volBtn.text}
              </a>
              <a href={link(volBtn.url) || "#"} {...(link(volBtn.url) ? { target: "_blank", rel: "noreferrer" } : {})}
                className="absolute right-0 top-0 hidden h-full items-center bg-black/15 px-3 text-xs font-bold uppercase tracking-widest [writing-mode:vertical-rl] md:flex">
                {volBtn.text}
              </a>
            </>
          ) : null}
        </div>
      </section>
    ),
    stories: (
      <section id="stories" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-bold uppercase tracking-tight">{heading(siteData, "stories", "Success Stories")}</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonialsOf(siteData).map((t, i) => (
            <figure key={t.id || i}>
              <Quote className="h-7 w-7" style={{ color: "var(--brand-primary)" }} />
              <blockquote className="mt-3 text-sm leading-relaxed text-black/65">{t.quote}</blockquote>
              <figcaption className="mt-4 border-t border-black/10 pt-3">
                <p className="text-sm font-bold uppercase tracking-wide">{t.name}</p>
                {t.role ? <p className="text-xs text-black/45">{t.role}</p> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="bg-[#F7F5F2]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 fill-current" style={{ color: "var(--brand-primary)" }} />
            <Brandmark siteData={siteData} name={name} className="text-sm font-bold uppercase tracking-wide" />
          </div>
          <nav className="hidden gap-6 text-xs font-semibold uppercase tracking-wide text-black/60 lg:flex">
            {navItems(siteData, [["Home", "#"], ["Who We Are", "#helping"], ["Where We Work", "#services"], ["Our Blog", "#stories"], ["Contacts", "#footer"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "helping", "services", "volunteers", "stories", "donation"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer id="footer" className="bg-[#EDEAE5]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3 md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-7 w-7 fill-current" style={{ color: "var(--brand-primary)" }} />
              <div><p className="text-sm font-bold uppercase tracking-wide">{name}</p><p className="text-[11px] uppercase tracking-wide text-black/45">&amp; You · Privacy Policy</p></div>
            </div>
            <SocialIcons social={siteData.social} className="mt-3 text-black/50" />
          </div>
          <div className="md:text-center">
            <p className="text-2xl font-bold">{siteData.phone || "(800) 123 1234"}</p>
            <p className="mt-1 text-xs text-black/50">{siteData.address || "12 East Street, City, FL 90745"}</p>
            {siteData.email ? <p className="text-xs text-black/50">{siteData.email}</p> : null}
          </div>
          <div className="md:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Newsletter</p>
            <div className="mt-2 flex gap-2 md:justify-end">
              <input className="min-w-0 flex-1 rounded-md border border-black/15 px-3 py-2 text-sm md:max-w-[200px]" placeholder="Your email" />
              <BrandButton className="px-4 py-2"><ArrowRight className="h-4 w-4" /></BrandButton>
            </div>
            <a href="#" className="mt-4 inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--brand-primary)" }}>
              View Our Report {year} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="border-t border-black/5 py-5 text-center text-xs text-black/40">© {year} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
