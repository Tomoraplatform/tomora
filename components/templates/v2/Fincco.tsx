"use client";

import { ArrowRight, TrendingUp, Building2, Briefcase, LineChart, Sparkles, Headphones, Star, Phone } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, BrandButton, Img, heading, subheading, navItems, headerCta, CustomSections, OrderedSections } from "./shared";
import { DonationSection } from "./DonationSection";
import { HeroDonation } from "../donation-context";

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
const FEATURE_ICONS = [LineChart, TrendingUp, Sparkles, Headphones];

export function Fincco({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Fincco";
  const overlay = siteData.heroOverlayColor || GREEN;
  const heroBtn = siteData.sectionButtons?.hero || {};
  const aboutBtn = siteData.sectionButtons?.about || {};
  const ctaBtn = siteData.sectionButtons?.cta || {};
  const joinBtn = siteData.sectionButtons?.join || {};
  const ctaColor = siteData.sectionColors?.cta || GREEN;
  const statsColor = siteData.sectionColors?.stats || GREEN;
  const aboutAvatars = siteData.heroAvatars?.length ? siteData.heroAvatars : [0, 1, 2].map((i) => ({ id: `fc${i}`, name: "", image: `https://picsum.photos/seed/fin-c${i}/48` }));
  const projectItems = siteData.portfolioItems?.length ? siteData.portfolioItems : PROJECTS.map((title, i) => ({ id: `fp${i}`, title, category: "", description: "", image: `https://picsum.photos/seed/fin-proj${i}/600/400` }));
  const serviceItems = siteData.services?.length ? siteData.services : SERVICES.map((s, i) => ({ id: `sv${i}`, title: s.t, description: "Tailored strategies for your goals." }));
  const featItems = siteData.eduFeatures?.length ? siteData.eduFeatures : FEATURES.map((f, i) => ({ id: `ff${i}`, title: f.t, description: "Built around your needs." }));
  const statItems = siteData.stats?.length ? siteData.stats : STATS.map(([value, label], i) => ({ id: `fs${i}`, value: value as string, label: label as string }));

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <div className="bg-[#0D3B2A] py-2 text-center text-xs text-white/70">12 Marina Road, Lagos · hello@fincco.com</div>
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{navItems(siteData, [["Homepage","#"],["About Us","#about"],["Case Study","#projects"],["Services","#services"],["Pages","#projects"]]).map(([l, h]) => <a key={l} href={h}>{l}</a>)}</nav>
          <div className="flex items-center gap-3"><span className="hidden items-center gap-1 text-sm text-black/60 sm:flex"><Phone className="h-4 w-4" /> +234 800 000</span>{(() => { const c = headerCta(siteData, "Free Consultation"); return <BrandButton as="a" href={c.href} className="px-4 py-2">{c.text}</BrandButton>; })()}</div>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "about", "services", "cta", "projects", "features", "stats", "join", "donation"]} blocks={{
        donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
        hero: (
          <section className="relative">
            <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to right, ${overlay}F2, ${overlay}80)` }} />
            <div className="relative mx-auto max-w-6xl px-5 py-28 text-white">
              {(siteData.sectionEyebrows?.hero ?? "A long-term investment in your future") && <span className="text-sm font-semibold uppercase tracking-wide opacity-80">{siteData.sectionEyebrows?.hero ?? "A long-term investment in your future"}</span>}
              <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">{siteData.heroHeadline}</h1>
              <p className="mt-4 max-w-md text-white/80">{siteData.heroSubtext}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <BrandButton as="a" href={siteData.donationEnabled ? "#donate" : (siteData.ctaHref || "#")}>{siteData.ctaText || "Free Consultation"} <ArrowRight className="h-4 w-4" /></BrandButton>
                {(heroBtn.text ?? "Learn More") && (
                  <a href={heroBtn.url?.trim() || "#"} {...(heroBtn.url?.trim() ? { target: "_blank", rel: "noreferrer" } : {})} className="inline-flex items-center gap-2 rounded-md border border-white/40 px-6 py-3 text-sm font-semibold">{heroBtn.text || "Learn More"}</a>
                )}
              </div>
              {siteData.donationEnabled && <div className="mt-7"><HeroDonation tone="dark" /></div>}
            </div>
          </section>
        ),
        about: (
          <section id="about" className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 lg:grid-cols-[40%_60%]">
            <h2 className="text-3xl font-bold">{heading(siteData, "experience", "15+ Years of Financial Experience")}</h2>
            <div>
              <p className="text-black/60">{subheading(siteData, "experience", "We are the magic behind the company's best days, combining data, strategy and human insight to grow your wealth.")}</p>
              <div className="mt-4 flex items-center gap-4"><div className="flex" style={{ color: "var(--brand-primary)" }}>{[0,1,2,3,4].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div><div className="flex -space-x-2">{aboutAvatars.slice(0, 6).map((a) => <Img key={a.id} src={a.image} className="h-8 w-8 rounded-full border-2 border-white object-cover" />)}</div></div>
              {(aboutBtn.text ?? "Discover Work") && <BrandButton as="a" href={aboutBtn.url?.trim() || "#"} className="mt-5">{aboutBtn.text || "Discover Work"}</BrandButton>}
            </div>
          </section>
        ),
        services: (
          <section id="services" className="mx-auto max-w-6xl px-5 pb-16 pt-4">
            <h2 className="text-center text-3xl font-bold">{heading(siteData, "services", "The largest truly global wealth manager")}</h2>
            {subheading(siteData, "services", "") && <p className="mx-auto mt-3 max-w-xl text-center text-black/60">{subheading(siteData, "services", "")}</p>}
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {serviceItems.map((s, i) => {
                const Icon = SERVICES[i % SERVICES.length].icon;
                const link = (s as { linkUrl?: string }).linkUrl?.trim();
                return (
                  <div key={s.id || i} className="rounded-2xl border border-black/10 p-6"><span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-semibold">{s.title}</h3>{s.description && <p className="mt-1 text-sm text-black/60">{s.description}</p>}<a href={link || "#"} {...(link ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-3 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Learn More →</a></div>
                );
              })}
            </div>
          </section>
        ),
        cta: (
          <section className="relative">
            <Img src={siteData.sectionImages?.cta || "https://picsum.photos/seed/fin-growth/1200/500"} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: `${ctaColor}E6` }} />
            <div className="relative mx-auto max-w-3xl px-5 py-16 text-center text-white"><h2 className="text-3xl font-bold">{heading(siteData, "cta", "Think fresh, work faster, grow smarter, save money.")}</h2>{(ctaBtn.text ?? "Get Started") && <a href={ctaBtn.url?.trim() || "#"} {...(ctaBtn.url?.trim() ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-6 inline-block rounded-md border border-white/40 px-6 py-3 text-sm font-semibold">{ctaBtn.text || "Get Started"}</a>}</div>
          </section>
        ),
        projects: (
          <section id="projects" className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="text-center text-3xl font-bold">{heading(siteData, "values", "We bring your business to new heights.")}</h2>
            {subheading(siteData, "values", "") && <p className="mx-auto mt-3 max-w-xl text-center text-black/60">{subheading(siteData, "values", "")}</p>}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projectItems.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-2xl"><Img src={p.image} className="aspect-[3/2] w-full object-cover" /><div className="absolute inset-0 bg-black/40" /><p className="absolute bottom-4 left-4 font-semibold text-white">{p.title}</p></div>
              ))}
            </div>
          </section>
        ),
        features: (
          <section className="bg-[#F4F8F6]">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold">{heading(siteData, "invest", "Unlocking Investment Opportunities Together.")}</h2>
                {subheading(siteData, "invest", "") && <p className="mt-3 max-w-md text-black/60">{subheading(siteData, "invest", "")}</p>}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {featItems.map((f, i) => {
                  const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                  return (
                    <div key={f.id} className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span><div><p className="font-semibold">{f.title}</p>{f.description && <p className="text-sm text-black/60">{f.description}</p>}</div></div>
                  );
                })}
              </div>
            </div>
          </section>
        ),
        stats: (
          <section style={{ background: statsColor }} className="text-white">
            <div className="mx-auto max-w-5xl px-5 py-12">
              {siteData.sectionTitles?.stats && <h2 className="mb-8 text-center text-2xl font-bold">{siteData.sectionTitles.stats}</h2>}
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
                {statItems.map((s) => <div key={s.id}><p className="text-3xl font-bold" style={{ color: "var(--brand-primary-light)" }}>{s.value}</p><p className="mt-1 text-sm text-white/60">{s.label}</p></div>)}
              </div>
            </div>
          </section>
        ),
        join: (
          <section className="mx-auto max-w-3xl px-5 py-16 text-center">
            <h2 className="text-3xl font-bold">{heading(siteData, "join", `Ready to make a difference? Join the ${name} team today.`)}</h2>
            {subheading(siteData, "join", "") && <p className="mx-auto mt-3 max-w-xl text-black/60">{subheading(siteData, "join", "")}</p>}
            {(joinBtn.text ?? "Join Now") && <BrandButton as="a" href={joinBtn.url?.trim() || "#"} className="mt-6">{joinBtn.text || "Join Now"}</BrandButton>}
          </section>
        ),
      }} />
      <CustomSections sections={siteData.customSections} at="bottom" />
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
