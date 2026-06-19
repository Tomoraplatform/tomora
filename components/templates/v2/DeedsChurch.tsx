"use client";

import { Phone, Mail, ArrowRight, Quote } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, BrandButton, Img } from "./shared";

const MINISTRIES = [
  ["Education Ministry", "Equipping every generation with the Word."],
  ["Children Ministry", "A safe, joyful place for kids to grow."],
  ["Parent Ministry", "Supporting families at every stage."],
  ["Teacher Ministry", "Training and encouraging our teachers."],
];

export function DeedsChurch({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Deeds";

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <div className="text-white" style={{ background: "var(--brand-primary)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-2 text-xs sm:flex-row">
          <span className="font-semibold uppercase">Upcoming Event: 203 Days · 10 Hours · 81 Mins</span>
          <span className="flex items-center gap-4"><span className="flex items-center gap-1"><Phone className="h-3 w-3" /> +234 800 000</span><span className="flex items-center gap-1"><Mail className="h-3 w-3" /> hello@deeds.org</span></span>
        </div>
      </div>
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{["Home", "Sermons", "Events", "Stories", "About"].map((l) => <a key={l} href="#">{l}</a>)}</nav>
          <BrandButton className="px-4 py-2">Donate Now</BrandButton>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto max-w-3xl px-5 py-28 text-center text-white">
          <span className="text-xs uppercase tracking-widest text-white/60">New to {name}?</span>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">{siteData.heroHeadline}</h1>
          <a href="#" className="mt-6 inline-block rounded-md border-2 border-white px-6 py-3 text-sm font-semibold uppercase">Plan Your Visit</a>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[40%_60%]">
        <div className="relative">
          <Img src="https://picsum.photos/seed/deeds-a1/500/600" className="aspect-[5/6] w-full rounded-2xl object-cover" />
          <Img src="https://picsum.photos/seed/deeds-a2/300/300" className="absolute -bottom-6 -right-4 h-32 w-32 rounded-2xl border-4 border-white object-cover" />
          <div className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-center"><p className="text-xs text-black/50">Since</p><p className="text-2xl font-bold">1996</p></div>
        </div>
        <div>
          <span className="text-sm font-semibold uppercase" style={{ color: "var(--brand-primary)" }}>Work of the Church</span>
          <h2 className="mt-2 text-3xl font-bold">We Preach the Gospel in Every Sermon</h2>
          <p className="mt-3 text-black/60">{siteData.heroSubtext}</p>
          <blockquote className="mt-5 border-l-4 pl-4 text-black/70" style={{ borderColor: "var(--brand-primary)" }}><Quote className="mb-1 h-5 w-5" style={{ color: "var(--brand-primary)" }} />Faith, hope and love — and the greatest of these is love.</blockquote>
          <BrandButton className="mt-5">About The Church <ArrowRight className="h-4 w-4" /></BrandButton>
        </div>
      </section>

      {/* Ministries */}
      <section className="bg-[#F5F5F5]">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 lg:grid-cols-[40%_60%]">
          <div>
            <h2 className="text-3xl font-bold">Explore Our Church Ministries</h2>
            <p className="mt-3 text-black/60">There is a place for everyone to belong, serve and grow.</p>
            <a href="#" className="mt-4 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>All Church Ministries →</a>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {MINISTRIES.map(([t, d], i) => (
              <div key={t} className="overflow-hidden rounded-2xl bg-white shadow-sm"><Img src={`https://picsum.photos/seed/deeds-min${i}/500/300`} className="aspect-[5/3] w-full object-cover" /><div className="p-5"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-black/60">{d}</p><a href="#" className="mt-2 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>→ Read More</a></div></div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div><p className="text-lg font-bold">{name}</p><p className="mt-2 text-black/50">A place to grow in faith and community.</p></div>
          {[["Explore", ["Sermons", "Events", "Stories"]], ["Connect", ["Visit", "Groups", "Give"]], ["Contact", [siteData.phone || "+234 800 000", siteData.email || "hello@deeds.org"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-black/50">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="border-t border-black/5 py-5 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
