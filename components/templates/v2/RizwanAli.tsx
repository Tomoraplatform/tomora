"use client";

import { useState } from "react";
import { Download, Linkedin, Instagram, Github, Layout, PenTool, Globe, Smartphone, Quote, Star } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, testimonialsOf, BrandButton, Img, ContactFormV2 } from "./shared";

const SERVICES = [
  { icon: Layout, t: "UX/UI", d: "Intuitive interfaces that delight users." },
  { icon: PenTool, t: "Graphics", d: "Striking visuals and brand assets." },
  { icon: Globe, t: "Web Design", d: "Responsive, modern websites." },
  { icon: Smartphone, t: "App Design", d: "Polished mobile experiences." },
];
const STATS = [["181+", "Graphics"], ["50+", "Website Design"], ["120+", "Projects"], ["8+", "Years"]];
const FILTERS = ["All", "UI/UX", "Branding", "Web"];

export function RizwanAli({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Rizwan Ali";
  const items = siteData.portfolioItems || [];
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? items : items.filter((p) => p.category.toLowerCase().includes(filter.toLowerCase()));

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{["Home", "About Me", "Services", "Portfolio", "Testimonials", "Contact"].map((l) => <a key={l} href="#">{l}</a>)}</nav>
          <BrandButton className="px-4 py-2">Contact Me</BrandButton>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[45%_55%]">
        <div>
          <p className="text-black/50">Hi! I am</p>
          <h1 className="mt-1 text-5xl font-bold">{name}</h1>
          <p className="mt-2 text-xl font-medium text-black/70">Professional UI/UX & Website Designer</p>
          <p className="mt-4 max-w-md text-black/60">{siteData.heroSubtext}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <BrandButton>Hire Me</BrandButton>
            <a href="#" className="flex items-center gap-2 text-sm font-semibold"><Download className="h-4 w-4" /> Download CV</a>
          </div>
          <div className="mt-6 flex gap-3 text-black/50">{[Linkedin, Instagram, Github].map((I, i) => <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10"><I className="h-4 w-4" /></span>)}</div>
        </div>
        <div className="relative mx-auto">
          <div className="absolute inset-0 -z-0 rounded-full" style={{ background: "var(--brand-primary-light)" }} />
          <Img src={siteData.heroImage} className="relative z-10 mx-auto aspect-square w-72 rounded-full object-cover sm:w-80" />
        </div>
      </section>

      {/* About */}
      <section className="bg-[#F7F9FC]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
          <Img src="https://picsum.photos/seed/riz-about/700/700" className="mx-auto aspect-square w-72 rounded-full object-cover" />
          <div>
            <h2 className="text-3xl font-bold">About Me</h2>
            <div className="mt-6 grid grid-cols-2 gap-5">
              {STATS.map(([n, l]) => (
                <div key={l} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-3xl font-bold" style={{ color: "var(--brand-primary)" }}>{n}</p><p className="text-sm text-black/50">{l}</p></div>
              ))}
            </div>
            <BrandButton className="mt-6">Learn More</BrandButton>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold">Services</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-black/10 p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-semibold">{t}</h3><p className="mt-1 text-sm text-black/60">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="bg-[#F7F9FC]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-center text-3xl font-bold">My Projects</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className="rounded-full px-4 py-2 text-sm font-medium" style={filter === f ? { background: "var(--brand-primary)", color: "var(--brand-on-primary)" } : { background: "#fff" }}>{f}</button>)}
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <Img src={p.image} className="aspect-[4/3] w-full object-cover" />
                <div className="p-4"><span className="text-xs font-semibold uppercase" style={{ color: "var(--brand-primary)" }}>{p.category}</span><h3 className="mt-1 font-semibold">{p.title}</h3><p className="mt-1 text-sm text-black/60">{p.description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold">Testimonials</h2>
        {testimonialsOf(siteData).slice(0, 1).map((t, i) => (
          <figure key={i} className="mt-8 rounded-2xl border border-black/10 p-8 text-center">
            <div className="flex justify-center gap-1" style={{ color: "var(--brand-primary)" }}>{[0,1,2,3,4].map((n) => <Star key={n} className="h-4 w-4 fill-current" />)}</div>
            <Quote className="mx-auto mt-3 h-7 w-7 text-black/20" />
            <blockquote className="mt-3 text-lg text-black/70">{t.quote}</blockquote>
            <figcaption className="mt-4"><p className="font-semibold">{t.name}</p>{t.role ? <p className="text-sm text-black/50">{t.role}</p> : null}</figcaption>
          </figure>
        ))}
      </section>

      {/* Contact */}
      {siteData.contactForm !== false && (
        <section className="bg-[#F7F9FC]">
          <div className="mx-auto max-w-xl px-5 py-16">
            <h2 className="text-center text-3xl font-bold">Contact Me</h2>
            <p className="mt-2 text-center text-black/60">Have a project in mind? Let&apos;s build it together.</p>
            <div className="mt-8"><ContactFormV2 submitText="Subscribe Me" phone={false} /></div>
          </div>
        </section>
      )}

      <footer className="bg-[#F7F9FC] py-8 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</footer>
    </BrandStyle>
  );
}
