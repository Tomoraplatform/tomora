"use client";

import { HandHeart, GraduationCap, Baby, Users, Quote, ChevronRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, testimonialsOf, servicesOf, SocialIcons, BrandButton, Img } from "./shared";

const SERVICES = [
  { icon: HandHeart, t: "Help & Support" }, { icon: GraduationCap, t: "Education" },
  { icon: Baby, t: "Adoption" }, { icon: Users, t: "Volunteering" },
];

export function OpenHeart({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Open Heart";

  return (
    <BrandStyle brandColor={brandColor} className="bg-[#F9F7F4] font-sans text-neutral-900">
      <header className="bg-[#F9F7F4]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Brandmark siteData={siteData} name={name} className="text-sm font-bold uppercase tracking-wide" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{["Home", "Who We Are", "Where We Work", "Blog", "Contact"].map((l) => <a key={l} href="#">{l}</a>)}</nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/30" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-5 py-28 text-white md:flex-row md:items-end md:justify-between">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{siteData.heroHeadline}</h1>
          <div className="shrink-0">
            <BrandButton as="a" href={siteData.ctaHref || "#"}>{siteData.ctaText || "Donate Now"} <ChevronRight className="h-4 w-4" /></BrandButton>
            <div className="mt-4"><p className="text-xs uppercase tracking-wide text-white/60">Donation so far</p><p className="text-3xl font-bold">₦45,000,000</p></div>
          </div>
        </div>
      </section>

      {/* Impact grid */}
      <section className="grid grid-cols-3 gap-1">
        {[0,1,2].map((i) => <Img key={i} src={`https://picsum.photos/seed/oh-impact${i}/500/360`} className="h-48 w-full object-cover grayscale sm:h-64" />)}
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-3xl font-bold leading-tight">Give a helping hand to those who need it!</h2>
        <p className="mt-4 text-black/60">{siteData.heroSubtext}</p>
        <a href="#" className="mt-6 inline-block rounded-md border-2 px-6 py-3 text-sm font-semibold" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}>Read More</a>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {servicesOf(siteData, SERVICES.map((s) => ({ title: s.t, description: "Programs that change lives every day." }))).map((s, i) => {
            const Icon = SERVICES[i % SERVICES.length].icon;
            return (
              <div key={i} className="text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-6 w-6" /></span><h3 className="mt-3 font-semibold">{s.title}</h3><p className="mt-1 text-sm text-black/60">{s.description}</p></div>
            );
          })}
        </div>
      </section>

      {/* Volunteer band */}
      <section className="grid md:grid-cols-2">
        <div className="px-6 py-14 text-white md:px-12" style={{ background: "var(--brand-primary)" }}>
          <span className="text-sm font-semibold uppercase tracking-wide opacity-80">Get involved</span>
          <h2 className="mt-2 text-3xl font-bold">We Need Volunteers</h2>
          <p className="mt-3 max-w-md opacity-90">Join hundreds of volunteers bringing hope to communities across Africa.</p>
          <a href="#" className="mt-6 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Join Now</a>
        </div>
        <Img src="https://picsum.photos/seed/oh-vol/800/600" className="h-64 w-full object-cover md:h-auto" />
      </section>

      {/* Success stories */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold">Success Stories</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonialsOf(siteData).map((t, i) => (
            <figure key={t.id || i} className="rounded-2xl bg-white p-6 shadow-sm"><Quote className="h-6 w-6" style={{ color: "var(--brand-primary)" }} /><blockquote className="mt-3 text-sm text-black/70">{t.quote}</blockquote><figcaption className="mt-4 text-sm font-semibold">{t.name}</figcaption></figure>
          ))}
        </div>
      </section>

      <footer className="bg-[#F9F7F4] border-t border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 px-5 py-12 md:flex-row">
          <div><p className="text-lg font-bold">{name}</p><p className="mt-2 text-sm text-black/50">{siteData.address || "Lagos, Nigeria"}<br />{siteData.phone || "+234 800 000 0000"}<br />{siteData.email || "hello@openheart.org"}</p><SocialIcons social={siteData.social} className="mt-3 text-black/60" /></div>
          <div><p className="text-sm font-semibold">Newsletter</p><div className="mt-3 flex gap-2"><input className="rounded-md border border-black/15 px-3 py-2 text-sm" placeholder="Email" /><BrandButton className="px-4 py-2">Subscribe</BrandButton></div></div>
        </div>
        <div className="border-t border-black/5 py-5 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
