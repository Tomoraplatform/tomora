"use client";

import { useState } from "react";
import {
  Heart, Facebook, Instagram, Linkedin, Briefcase, Smartphone, PenTool, TrendingUp, Layout, Globe,
  Mail, Phone, MapPin, Quote, Bookmark,
} from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, BrandButton, Img, ContactFormV2 } from "./shared";

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
  const [tab, setTab] = useState("Education");

  return (
    <BrandStyle brandColor={brandColor} className="bg-[#F5F5F7] font-sans text-neutral-900">
      <header className="bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold">{name}</span>
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{["Home", "Features", "Portfolio", "Resume", "Pricing", "Contact"].map((l) => <a key={l} href="#">{l}</a>)}</nav>
          <div className="flex items-center gap-3"><Heart className="h-5 w-5 text-black/40" /><BrandButton className="px-4 py-2">Buy Now</BrandButton></div>
        </div>
      </header>

      {/* Hero */}
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

      {/* What I Do */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-bold">What I Do</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-semibold">{t}</h3><p className="mt-1 text-sm text-black/60">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolio */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-bold">My Portfolio</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-2xl">
              <Img src={p.image} className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase">{p.category}</span>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <p className="font-semibold">{p.title}</p><Bookmark className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resume */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-bold">My Resume</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.keys(RESUME).map((k) => (
            <button key={k} onClick={() => setTab(k)} className="rounded-full px-4 py-2 text-sm font-medium" style={tab === k ? { background: "var(--brand-primary)", color: "var(--brand-on-primary)" } : { background: "#fff" }}>{k}</button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {RESUME[tab].map((r, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
              <span className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>{r.a}</span>
              <h3 className="mt-1 font-semibold">{r.b}</h3><p className="text-sm text-black/60">{r.c}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto max-w-4xl px-5 py-14">
        <h2 className="text-center text-3xl font-bold">Testimonial</h2>
        <figure className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
          <Quote className="mx-auto h-8 w-8" style={{ color: "var(--brand-primary)" }} />
          <blockquote className="mt-4 text-lg text-black/70">Working with {name} was effortless. The final product exceeded our expectations and shipped on time.</blockquote>
          <figcaption className="mt-5"><p className="font-semibold">Tunde Bello</p><p className="text-sm text-black/50">CEO, Bello Co.</p></figcaption>
        </figure>
      </section>

      {/* Clients */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-center gap-10 opacity-50">
          {[0,1,2,3,4].map((i) => <Img key={i} src={`https://picsum.photos/seed/client${i}/120/48`} className="h-8 grayscale" />)}
        </div>
      </section>

      {/* Contact */}
      {siteData.contactForm !== false && (
        <section className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-3xl font-bold">Contact With Me</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm"><ContactFormV2 submitText="Send Message" /></div>
            <div className="space-y-4">
              {[[Mail, siteData.email || "hello@brand.com"], [Phone, siteData.phone || "+234 800 000 0000"], [MapPin, siteData.address || "Lagos, Nigeria"]].map(([I, v]: any, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><I className="h-5 w-5" /></span><span className="text-sm">{v}</span></div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-white py-8 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</footer>
    </BrandStyle>
  );
}
