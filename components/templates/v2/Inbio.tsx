"use client";

import { useState } from "react";
import {
  Heart, Facebook, Instagram, Linkedin, Briefcase, Smartphone, PenTool, TrendingUp, Layout, Globe,
  Mail, Phone, MapPin, Quote, Bookmark, CalendarCheck, X as XIcon,
} from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, testimonialsOf, servicesOf, SocialIcons, BrandButton, Img, ContactFormV2, heading, subheading, navItems, headerCta, CustomSections, OrderedSections } from "./shared";
import { DonationSection } from "./DonationSection";

const SERVICES = [
  { icon: TrendingUp, t: "Business Strategy", d: "Plans that turn ideas into measurable growth." },
  { icon: Layout, t: "App Development", d: "Robust, scalable applications built to last." },
  { icon: Smartphone, t: "Mobile App", d: "Native-feel mobile experiences users love." },
  { icon: Globe, t: "Web Design", d: "Beautiful, conversion-focused websites." },
  { icon: PenTool, t: "Brand Identity", d: "Distinctive brands with personality." },
  { icon: Briefcase, t: "Consulting", d: "Hands-on guidance for your next launch." },
];

const RESUME: Record<string, { a: string; b: string; c: string }[]> = {
  Education: [{ a: "2016 - 2020", b: "University of Lagos", c: "BSc Computer Science" }, { a: "2020 - 2022", b: "Design Academy", c: "Product Design Diploma" }],
  "Professional Skills": [{ a: "Design", b: "Figma, UI/UX", c: "Expert" }, { a: "Development", b: "React, Next.js", c: "Advanced" }],
  Experience: [{ a: "2022 - Now", b: "Senior Designer, Studio", c: "Leading product design" }, { a: "2020 - 2022", b: "Designer, Agency", c: "Client work" }],
  Interview: [{ a: "Available", b: "Open to projects", c: "Let's talk" }],
};

export function Inbio({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Alex Morgan";
  const items = siteData.portfolioItems || [];
  const clientLogos = siteData.clientLogos || [];
  const bookingUrl = (siteData.bookingUrl || "").trim();
  const [lightbox, setLightbox] = useState<{ image?: string; title?: string } | null>(null);

  // Build resume tabs from editable siteData.resume, falling back to demo content.
  const resumeGroups: Record<string, { a: string; b: string; c: string }[]> = {};
  if (siteData.resume && siteData.resume.length) {
    for (const r of siteData.resume) {
      const g = r.group || "Resume";
      (resumeGroups[g] ||= []).push({ a: r.title, b: r.subtitle, c: r.detail || "" });
    }
  } else {
    Object.assign(resumeGroups, RESUME);
  }
  const resumeTabs = Object.keys(resumeGroups);
  const [tab, setTab] = useState(resumeTabs[0] || "Education");
  const activeTab = resumeGroups[tab] ? tab : resumeTabs[0];

  const blocks: Record<string, React.ReactNode> = {
    donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
    hero: (
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-primary)" }}>Welcome to my world</span>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Hi, I&apos;m <span style={{ color: "var(--brand-primary)" }}>{name}</span><br />a Professional Designer</h1>
          <p className="mt-4 max-w-md text-black/60">{siteData.heroSubtext}</p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3"><span className="text-xs font-semibold uppercase text-black/40">Find with me</span>{[Facebook, Instagram, Linkedin].map((I, i) => <span key={i} className="flex h-9 w-9 items-center justify-center rounded-md bg-white shadow-sm"><I className="h-4 w-4" /></span>)}</div>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-lg"><Img src={siteData.heroImage} className="aspect-[4/5] w-full rounded-2xl object-cover" /></div>
          <div className="absolute -bottom-4 left-6 rounded-xl bg-white px-4 py-3 shadow-lg"><p className="text-xs text-black/40">Status</p><p className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Available for work</p></div>
        </div>
      </section>
    ),
    about: (
      <section id="about" className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-lg">
              <Img src={siteData.sectionImages?.about || siteData.heroImage} className="aspect-square w-full rounded-2xl object-cover" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold">{heading(siteData, "about", "About Me")}</h2>
            <p className="mt-4 whitespace-pre-line text-black/60">{subheading(siteData, "about", "Tell visitors who you are, what you do, and why you love it.")}</p>
          </div>
        </div>
      </section>
    ),
    services: (
      <section id="services" className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-bold">{heading(siteData, "services", "What I Do")}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {servicesOf(siteData, SERVICES.map((s) => ({ title: s.t, description: s.d }))).map((s, i) => {
            const Icon = SERVICES[i % SERVICES.length].icon;
            return (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold">{s.title}</h3><p className="mt-1 text-sm text-black/60">{s.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    ),
    portfolio: (
      <section id="portfolio" className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-bold">{heading(siteData, "portfolio", "My Portfolio")}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <button
              key={p.id} type="button" onClick={() => setLightbox({ image: p.image, title: p.title })}
              className="group relative block overflow-hidden rounded-2xl text-left focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ ["--tw-ring-color" as any]: "var(--brand-primary)" }}
              aria-label={`View ${p.title}`}
            >
              <Img src={p.image} className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase">{p.category}</span>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <p className="font-semibold">{p.title}</p><Bookmark className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </section>
    ),
    resume: (
      <section id="resume" className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-bold">{heading(siteData, "resume", "My Resume")}</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {resumeTabs.map((k) => (
            <button key={k} onClick={() => setTab(k)} className="rounded-full px-4 py-2 text-sm font-medium" style={activeTab === k ? { background: "var(--brand-primary)", color: "var(--brand-on-primary)" } : { background: "#fff" }}>{k}</button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(resumeGroups[activeTab] || []).map((r, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
              <span className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>{r.a}</span>
              <h3 className="mt-1 font-semibold">{r.b}</h3><p className="text-sm text-black/60">{r.c}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    testimonials: (
      <section className="mx-auto max-w-4xl px-5 py-14">
        <h2 className="text-center text-3xl font-bold">{heading(siteData, "testimonials", "Testimonial")}</h2>
        {testimonialsOf(siteData).slice(0, 1).map((t, i) => (
          <figure key={i} className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <Quote className="mx-auto h-8 w-8" style={{ color: "var(--brand-primary)" }} />
            <blockquote className="mt-4 text-lg text-black/70">{t.quote}</blockquote>
            <figcaption className="mt-5"><p className="font-semibold">{t.name}</p>{t.role ? <p className="text-sm text-black/50">{t.role}</p> : null}</figcaption>
          </figure>
        ))}
      </section>
    ),
    clients: clientLogos.length ? (
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-center gap-10 opacity-60">
          {clientLogos.map((c) => (
            <Img key={c.id} src={c.image} alt={c.name} className="h-8 w-auto object-contain grayscale transition hover:grayscale-0" />
          ))}
        </div>
      </section>
    ) : null,
    booking: (
      <section id="booking" className="mx-auto max-w-5xl px-5 py-14">
        <div className="overflow-hidden rounded-3xl p-8 text-center sm:p-12" style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}>
          <CalendarCheck className="mx-auto h-9 w-9 opacity-90" />
          <h2 className="mt-4 text-3xl font-bold">{heading(siteData, "booking", "Book a Session With Me")}</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">{subheading(siteData, "booking", "Have a project in mind? Book a free call and let's talk about how I can help.")}</p>
          <a
            href={bookingUrl || "#contact"}
            {...(bookingUrl ? { target: "_blank", rel: "noreferrer" } : {})}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:opacity-90"
          >
            <CalendarCheck className="h-4 w-4" /> {siteData.ctaText || "Schedule a session"}
          </a>
        </div>
      </section>
    ),
    contact: siteData.contactForm !== false ? (
      <section id="contact" className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-bold">{heading(siteData, "contact", "Contact With Me")}</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm"><ContactFormV2 submitText="Send Message" /></div>
          <div className="space-y-4">
            {[[Mail, siteData.email || "hello@brand.com"], [Phone, siteData.phone || "+234 800 000 0000"], [MapPin, siteData.address || "Lagos, Nigeria"]].map(([I, v]: any, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><I className="h-5 w-5" /></span><span className="text-sm">{v}</span></div>
            ))}
          </div>
        </div>
      </section>
    ) : null,
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-[#F5F5F7] font-sans text-neutral-900">
      <header className="bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{navItems(siteData, [["Home","#"],["Features","#services"],["Portfolio","#portfolio"],["Resume","#resume"],["Pricing","#services"],["Contact","#contact"]]).map(([l, h]) => <a key={l} href={h}>{l}</a>)}</nav>
          <div className="flex items-center gap-3"><Heart className="h-5 w-5 text-black/40" />{(() => { const c = headerCta(siteData, "Buy Now"); return <BrandButton as="a" href={c.href} className="px-4 py-2">{c.text}</BrandButton>; })()}</div>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "about", "services", "portfolio", "resume", "testimonials", "clients", "booking", "contact", "donation"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />
      <footer className="bg-white py-8 text-center text-sm text-black/40"><SocialIcons social={siteData.social} className="mb-3 justify-center" />© {new Date().getFullYear()} {name}. Built with Tomora.</footer>

      {/* Portfolio image lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)} aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <figure className="max-h-[90vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Img src={lightbox.image} alt={lightbox.title} className="max-h-[80vh] w-auto rounded-xl object-contain" />
            {lightbox.title && <figcaption className="mt-3 text-center text-sm text-white/80">{lightbox.title}</figcaption>}
          </figure>
        </div>
      )}
    </BrandStyle>
  );
}
