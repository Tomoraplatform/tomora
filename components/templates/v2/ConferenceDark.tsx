"use client";

import { ArrowRight, Mic, Users, Calendar, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, BrandButton, Img, heading, subheading, CustomSections, OrderedSections } from "./shared";
import { DonationSection } from "./DonationSection";

const NAVY = "#0A0F2E";
const ABOUT = [{ icon: Mic, t: "World-class Speakers" }, { icon: Users, t: "Global Network" }, { icon: Calendar, t: "Daily Sessions" }];
const ABOUT_ICONS = [Mic, Users, Calendar];
const WHY = [{ icon: Zap, t: "High Energy" }, { icon: ShieldCheck, t: "Trusted Hosts" }, { icon: Sparkles, t: "Fresh Ideas" }];
const WHY_ICONS = [Zap, ShieldCheck, Sparkles];

export function ConferenceDark({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Conference";
  const overlay = siteData.heroOverlayColor || NAVY;
  const aboutItems = siteData.quickActions?.length ? siteData.quickActions : ABOUT.map((a, i) => ({ id: `ab${i}`, title: a.t, description: "Everything you need for a great event." }));
  const missionBullets = siteData.eduFeatures?.length ? siteData.eduFeatures : ["50+ speakers", "20 workshops", "3000 attendees"].map((t, i) => ({ id: `mb${i}`, title: t, description: "" }));
  const whyItems = siteData.services?.length ? siteData.services : WHY.map((w, i) => ({ id: `wh${i}`, title: w.t, description: "Reasons attendees love us." }));

  return (
    <BrandStyle brandColor={brandColor} className="font-sans text-white" >
      <header className="border-b border-white/10" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-white/70 lg:flex">{[["Home","#"],["About","#about"],["Speakers","#mission"],["Blog","#why"],["Area","#why"]].map(([l, h]) => <a key={l} href={h}>{l}</a>)}</nav>
          <BrandButton className="px-4 py-2">Free Quote</BrandButton>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "about", "mission", "why", "donation"]} blocks={{
        donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
        hero: (
          <section className="relative" style={{ background: NAVY }}>
            <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${overlay}, ${overlay}99)` }} />
            <div className="relative mx-auto max-w-6xl px-5 py-28">
              <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-6xl">{siteData.heroHeadline}</h1>
              <p className="mt-4 max-w-md text-white/70">{siteData.heroSubtext}</p>
              <BrandButton as="a" href={siteData.ctaHref || "#"} className="mt-7">{siteData.ctaText || "Register"} <ArrowRight className="h-4 w-4" /></BrandButton>
            </div>
          </section>
        ),
        about: (
          <section id="about" className="bg-white text-neutral-900">
            <div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:grid-cols-3">
              {aboutItems.map((a, i) => {
                const Icon = ABOUT_ICONS[i % ABOUT_ICONS.length];
                return (
                  <div key={a.id} className="rounded-2xl border border-black/10 p-6 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-6 w-6" /></span><h3 className="mt-3 font-semibold">{a.title}</h3>{a.description && <p className="mt-1 text-sm text-black/60">{a.description}</p>}</div>
                );
              })}
            </div>
          </section>
        ),
        mission: (
          <section id="mission" style={{ background: NAVY }}>
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[55%_45%]">
              <div>
                <h2 className="text-3xl font-bold">{heading(siteData, "mission", "Our Mission")}</h2>
                <p className="mt-4 text-white/70">{subheading(siteData, "mission", "We bring together builders, dreamers and leaders to share ideas that move the world forward. Two days of talks, workshops and connections.")}</p>
                <ul className="mt-4 space-y-2 text-white/70">{missionBullets.map((b) => <li key={b.id} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-primary)" }} />{b.title}</li>)}</ul>
              </div>
              <Img src={siteData.sectionImages?.mission || "https://picsum.photos/seed/conf-mission/700/500"} className="aspect-[7/5] w-full rounded-2xl object-cover" />
            </div>
          </section>
        ),
        why: (
          <section id="why" className="bg-white text-neutral-900">
            <div className="mx-auto max-w-6xl px-5 py-16">
              <h2 className="text-center text-3xl font-bold">{heading(siteData, "why", "Why Choose Us")}</h2>
              {subheading(siteData, "why", "") && <p className="mx-auto mt-3 max-w-xl text-center text-black/60">{subheading(siteData, "why", "")}</p>}
              <div className="mt-8 grid gap-5 sm:grid-cols-3">
                {whyItems.map((w, i) => {
                  const Icon = WHY_ICONS[i % WHY_ICONS.length];
                  const link = (w as { linkUrl?: string }).linkUrl?.trim();
                  return (
                    <div key={w.id} className="rounded-2xl border border-black/10 p-6 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-semibold">{w.title}</h3>{w.description && <p className="mt-1 text-sm text-black/60">{w.description}</p>}<a href={link || "#"} {...(link ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-3 inline-block rounded-md border px-4 py-2 text-sm font-semibold">Contact</a></div>
                  );
                })}
              </div>
            </div>
          </section>
        ),
      }} />
      <CustomSections sections={siteData.customSections} at="bottom" />
      <footer style={{ background: NAVY }} className="text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1"><p className="text-lg font-bold">{name}</p></div>
          {[["Profile", ["Pages", "Speakers"]], ["Day 14", ["Schedule", "Venue"]], ["Payments", ["Tickets", "Refunds"]], ["Buy One", ["Sponsors", "Press"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="text-sm font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-sm text-white/50">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="flex justify-center pb-3 pt-1"><SocialIcons social={siteData.social} className="opacity-70" /></div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
