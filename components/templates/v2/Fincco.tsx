"use client";

import { ArrowRight, TrendingUp, Building2, Briefcase, LineChart, Sparkles, Headphones, Star, Phone } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, servicesOf, SocialIcons, BrandButton, Img } from "./shared";

const GREEN = "#0D3B2A";
const SERVICES = [
  { icon: TrendingUp, t: "Global Wealth Management" }, { icon: Building2, t: "Personal & Corporate Banking" },
  { icon: Briefcase, t: "Asset Management" }, { icon: LineChart, t: "Trading & Investment" },
];
const FEATURES = [
  { icon: LineChart, t: "Financial Control" }, { icon: TrendingUp, t: "Asset Appreciation" },
  { icon: Sparkles, t: "Smart Solutions" }, { icon: Headphones, t: "24/7 Premium Support" },
];
const PROJECTS = ["Project Finance", "Investment Consulting", "International Financing", "Residential Property", "Lending & Financing", "Construction Finance"];
const STATS = [["52K+", "Happy Clients"], ["81K+", "Projects Done"], ["271+", "Professionals"], ["4.7", "Rating"]];

export function Fincco({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Fincco";

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <div className="bg-[#0D3B2A] py-2 text-center text-xs text-white/70">12 Marina Road, Lagos · hello@fincco.com</div>
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{["Homepage", "About Us", "Case Study", "Services", "Pages"].map((l) => <a key={l} href="#">{l}</a>)}</nav>
          <div className="flex items-center gap-3"><span className="hidden items-center gap-1 text-sm text-black/60 sm:flex"><Phone className="h-4 w-4" /> +234 800 000</span><BrandButton className="px-4 py-2">Free Consultation</BrandButton></div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D3B2A]/95 to-[#0D3B2A]/50" />
        <div className="relative mx-auto max-w-6xl px-5 py-28 text-white">
          <span className="text-sm font-semibold uppercase tracking-wide opacity-80">A long-term investment in your future</span>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">{siteData.heroHeadline}</h1>
          <p className="mt-4 max-w-md text-white/80">{siteData.heroSubtext}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <BrandButton as="a" href={siteData.ctaHref || "#"}>{siteData.ctaText || "Free Consultation"} <ArrowRight className="h-4 w-4" /></BrandButton>
            <a href="#" className="inline-flex items-center gap-2 rounded-md border border-white/40 px-6 py-3 text-sm font-semibold">Learn More</a>
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 lg:grid-cols-[40%_60%]">
        <h2 className="text-3xl font-bold">15+ Years of Financial Experience</h2>
        <div>
          <p className="text-black/60">We are the magic behind the company&apos;s best days — combining data, strategy and human insight to grow your wealth.</p>
          <div className="mt-4 flex items-center gap-4"><div className="flex" style={{ color: "var(--brand-primary)" }}>{[0,1,2,3,4].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div><div className="flex -space-x-2">{[0,1,2].map((i) => <Img key={i} src={`https://picsum.photos/seed/fin-c${i}/48`} className="h-8 w-8 rounded-full border-2 border-white object-cover" />)}</div></div>
          <BrandButton className="mt-5">Discover Work</BrandButton>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-center text-3xl font-bold">The largest truly global wealth manager</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {servicesOf(siteData, SERVICES.map((s) => ({ title: s.t, description: "Tailored strategies for your goals." }))).map((s, i) => {
            const Icon = SERVICES[i % SERVICES.length].icon;
            return (
              <div key={i} className="rounded-2xl border border-black/10 p-6"><span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-semibold">{s.title}</h3><p className="mt-1 text-sm text-black/60">{s.description}</p><a href="#" className="mt-3 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Learn More →</a></div>
            );
          })}
        </div>
      </section>

      {/* Growth CTA */}
      <section className="relative">
        <Img src="https://picsum.photos/seed/fin-growth/1200/500" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: `${GREEN}E6` }} />
        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center text-white"><h2 className="text-3xl font-bold">Think fresh, work faster, grow smarter, save money.</h2><a href="#" className="mt-6 inline-block rounded-md border border-white/40 px-6 py-3 text-sm font-semibold">Get Started</a></div>
      </section>

      {/* Projects */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold">We bring your business to new heights.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <div key={p} className="group relative overflow-hidden rounded-2xl"><Img src={`https://picsum.photos/seed/fin-proj${i}/600/400`} className="aspect-[3/2] w-full object-cover" /><div className="absolute inset-0 bg-black/40" /><p className="absolute bottom-4 left-4 font-semibold text-white">{p}</p></div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F4F8F6]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
          <h2 className="text-3xl font-bold">Unlocking Investment Opportunities Together.</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, t }) => (
              <div key={t} className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span><div><p className="font-semibold">{t}</p><p className="text-sm text-black/60">Built around your needs.</p></div></div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: GREEN }} className="text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 py-12 sm:grid-cols-4 text-center">
          {STATS.map(([n, l]) => <div key={l}><p className="text-3xl font-bold" style={{ color: "var(--brand-primary-light)" }}>{n}</p><p className="mt-1 text-sm text-white/60">{l}</p></div>)}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-3xl font-bold">Ready to make a difference? Join the {name} team today.</h2>
        <BrandButton className="mt-6">Join Now</BrandButton>
      </section>

      <footer style={{ background: GREEN }} className="text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2"><p className="text-lg font-bold">{name}</p><p className="mt-2 max-w-xs text-sm text-white/50">Trusted by 6+ million users in 175+ countries.</p><SocialIcons social={siteData.social} className="mt-4 text-white/70" /></div>
          {[["Company", ["About", "Careers", "Press"]], ["Services", ["Wealth", "Banking", "Trading"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="text-sm font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-sm text-white/50">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
