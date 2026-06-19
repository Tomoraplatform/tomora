"use client";

import { Search, Mail, Phone, FileText, PhoneCall, Users, Home as HomeIcon, Scale, MapPin, ArrowRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, BrandButton, Img } from "./shared";

const QUICK = [
  { icon: FileText, t: "Services & Forms" }, { icon: PhoneCall, t: "Useful Numbers" },
  { icon: Users, t: "Associations" }, { icon: HomeIcon, t: "Family Portal" }, { icon: Scale, t: "Legal Publications" },
];

export function Leychert({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Leychert";
  const events = siteData.events || [];

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div><Brandmark siteData={siteData} name={name} className="text-lg font-bold leading-none" /><p className="text-[10px] text-black/40">Community & Region</p></div>
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{["About", "Living Here", "Heritage", "Services"].map((l) => <a key={l} href="#">{l}</a>)}</nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-5 py-32 text-center text-white">
          <h1 className="font-serif text-5xl font-bold italic sm:text-6xl">{name}</h1>
          <p className="mt-3 text-white/80">{siteData.heroSubtext}</p>
          <div className="mt-6 flex justify-center gap-3">
            {[Search, Mail, Phone].map((I, i) => <span key={i} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur"><I className="h-5 w-5" /></span>)}
          </div>
        </div>
      </section>

      {/* Quick access */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK.map(({ icon: Icon, t }) => (
            <div key={t} className="flex flex-col items-center gap-3 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border-2" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}><Icon className="h-6 w-6" /></span><span className="text-sm font-semibold">{t}</span></div>
          ))}
        </div>
      </section>

      {/* News */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-8 lg:grid-cols-[40%_60%]">
          <div>
            <h2 className="font-serif text-4xl font-bold italic">News</h2>
            <BrandButton className="mt-4">View All News</BrandButton>
            {events[0] && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-black/10"><Img src={events[0].image} className="aspect-[16/9] w-full object-cover" /><div className="p-5"><span className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>{events[0].date}</span><h3 className="mt-1 font-semibold">{events[0].title}</h3><p className="mt-1 text-sm text-black/60">{events[0].description}</p><a href="#" className="mt-2 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Read More →</a></div></div>
            )}
          </div>
          <div className="divide-y divide-black/5">
            {events.map((e) => (
              <div key={e.id} className="flex gap-4 py-4"><span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: "var(--brand-primary)" }}>{e.date}</span><div><h3 className="font-semibold">{e.title}</h3><p className="text-sm text-black/60">{e.description}</p><a href="#" className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Read More →</a></div></div>
            ))}
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className="bg-[#FBF8F3]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-8 lg:grid-cols-[30%_70%]">
            <div><h2 className="font-serif text-4xl font-bold italic">Events</h2><p className="mt-3 text-black/60">Discover what&apos;s happening across the community.</p><BrandButton className="mt-4">All Events</BrandButton></div>
            <div className="flex gap-5 overflow-x-auto pb-2">
              {events.map((e) => (
                <div key={e.id} className="w-64 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="relative"><Img src={e.image} className="aspect-[4/3] w-full object-cover" /><span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-xs font-bold">{e.date}</span></div>
                  <div className="p-4"><h3 className="font-semibold">{e.title}</h3><a href="#" className="mt-1 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Read More →</a></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Territory */}
      <section className="relative">
        <Img src="https://picsum.photos/seed/ley-territory/1200/600" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 py-20 text-white lg:grid-cols-2">
          <div><h2 className="font-serif text-4xl font-bold italic">The Territory</h2><p className="mt-3 max-w-md text-white/80">Explore the towns, landmarks and natural beauty that make our region home.</p><a href="#" className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/50 px-6 py-3 text-sm font-semibold">View Interactive Map <ArrowRight className="h-4 w-4" /></a></div>
          <div className="flex justify-center"><MapPin className="h-24 w-24 text-white/60" /></div>
        </div>
      </section>

      <footer className="bg-[#1A1208] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
          <div><p className="text-lg font-bold">{name}</p><p className="mt-2 text-sm text-white/50">{siteData.address || "Town Hall, Main Street"}</p></div>
          <div><h4 className="text-sm font-semibold">Opening Hours</h4><ul className="mt-3 space-y-1 text-sm text-white/50"><li>Mon–Fri: 8:00 – 17:00</li><li>Sat: 9:00 – 13:00</li></ul></div>
          <div><h4 className="text-sm font-semibold">Contact</h4><p className="mt-3 text-sm text-white/50">{siteData.phone || "+234 800 000 0000"}<br />{siteData.email || "hello@leychert.gov"}</p></div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
