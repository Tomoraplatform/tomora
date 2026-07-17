"use client";

import { useState } from "react";
import { ArrowRight, Search, MapPin, Mic, CalendarDays, Globe, Star, Ticket } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, testimonialsOf, BrandButton, Img, heading, subheading, navItems, headerCta, ContactFormV2, CustomSections, OrderedSections } from "./shared";
import { DonationSection } from "./DonationSection";

const PROGRESS = [["Full Rating", 92], ["Management", 80], ["Social Media", 74]] as const;
const SCHED_TABS = ["All Events", "Presentation", "Evaluation", "Open Discussion"];
const FEATURES = [{ icon: Mic, t: "Advanced Speakers" }, { icon: CalendarDays, t: "Daily Workshops" }, { icon: Globe, t: "Global Community" }];
const FEATURE_ICONS = [Mic, CalendarDays, Globe];

export function Motivac({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Motivac";
  const events = siteData.events || [];
  const overlay = siteData.heroOverlayColor || "#1A0533";
  const progressItems = siteData.progress?.length ? siteData.progress : PROGRESS.map(([label, value], i) => ({ id: `pg${i}`, label: label as string, value: value as number }));
  const featItems = siteData.services?.length ? siteData.services : FEATURES.map((f, i) => ({ id: `f${i}`, title: f.t, description: "" }));
  const searchPh = siteData.searchPlaceholders || ["Search category", "Search date", "Search range"];
  const [tab, setTab] = useState(0);

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <div className="bg-[#1A0533] py-2 text-center text-xs text-white/80">Upcoming: Worldwide Conference, register before tickets sell out</div>

      <header className="bg-[#1A0533] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-white/70 lg:flex">{navItems(siteData, [["Home","#"],["Events","#venues"],["Speakers","#schedules"],["Blog","#venues"],["Contact","#register"]]).map(([l, h]) => <a key={l} href={h}>{l}</a>)}</nav>
          {(() => { const c = headerCta(siteData, "Register"); return <BrandButton as="a" href={c.href} className="px-4 py-2">{c.text}</BrandButton>; })()}
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "search", "about", "venues", "schedule", "services", "testimonials", "register", "donation"]} blocks={{
        donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
        hero: (
          <section className="relative">
            <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: overlay, opacity: 0.85 }} />
            <div className="relative mx-auto max-w-6xl px-5 py-28 text-white">
              <span className="text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--brand-primary)" }}>Worldwide Conference</span>
              <h1 className="mt-4 max-w-2xl font-serif text-5xl font-bold leading-tight sm:text-6xl">{siteData.heroHeadline}</h1>
              <div className="mt-8 flex flex-wrap gap-3">
                <BrandButton as="a" href={siteData.ctaHref || "#register"}>{siteData.ctaText || "Registration"} <ArrowRight className="h-4 w-4" /></BrandButton>
                <a href={siteData.ticketUrl?.trim() || "#register"} {...(siteData.ticketUrl?.trim() ? { target: "_blank", rel: "noreferrer" } : {})} className="inline-flex items-center gap-2 rounded-md border border-white/40 px-6 py-3 text-sm font-semibold"><Ticket className="h-4 w-4" /> {siteData.ticketText || "Get Ticket"}</a>
              </div>
            </div>
          </section>
        ),
        search: siteData.showSearch !== false ? (
          <section className="border-b border-black/5 bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 md:flex-row">
              {[0, 1, 2].map((i) => (
                <input key={i} className="flex-1 rounded-md border border-black/15 px-4 py-3 text-sm" placeholder={searchPh[i] || ""} />
              ))}
              <BrandButton><Search className="h-4 w-4" /> {siteData.searchButtonText || "Search Now"}</BrandButton>
            </div>
          </section>
        ) : null,
        about: (
          <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2">
            <div>
              {(siteData.sectionEyebrows?.about ?? "Why us") && <span className="text-sm font-semibold uppercase" style={{ color: "var(--brand-primary)" }}>{siteData.sectionEyebrows?.about ?? "Why us"}</span>}
              <h2 className="mt-2 text-3xl font-bold">{heading(siteData, "about", "Plan Your Events with Us")}</h2>
              <p className="mt-3 text-black/60">{subheading(siteData, "about", siteData.heroSubtext || "")}</p>
              <div className="mt-6 space-y-4">
                {progressItems.map((p) => {
                  const pct = Math.max(0, Math.min(100, p.value || 0));
                  return (
                    <div key={p.id}><div className="mb-1 flex justify-between text-sm"><span>{p.label}</span><span>{pct}%</span></div><div className="h-2 rounded-full bg-black/10"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand-primary)" }} /></div></div>
                  );
                })}
              </div>
            </div>
            <Img src={siteData.sectionImages?.about || "https://picsum.photos/seed/motivac-plan/800/600"} className="aspect-[4/3] w-full rounded-2xl object-cover" />
          </section>
        ),
        venues: (
          <section id="venues" className="bg-[#FBF7FC]">
            <div className="mx-auto max-w-6xl px-5 py-16">
              <div className="flex items-end justify-between"><h2 className="text-3xl font-bold">{heading(siteData, "venues", "Explore the Popular Venues")}</h2><a href="#" className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>View All</a></div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {events.slice(0, 3).map((e) => (
                  <div key={e.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <Img src={e.image} className="aspect-[4/3] w-full object-cover" />
                    <div className="p-5"><h3 className="font-semibold">{e.title}</h3><p className="mt-1 text-sm text-black/60">{e.description}</p><p className="mt-2 flex items-center gap-1 text-sm text-black/50"><MapPin className="h-4 w-4" /> {e.location}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ),
        schedule: (
          <section id="schedules" className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="text-3xl font-bold">{heading(siteData, "schedule", "Information of Event Schedules")}</h2>
            {subheading(siteData, "schedule", "") && <p className="mt-3 max-w-2xl text-black/60">{subheading(siteData, "schedule", "")}</p>}
            <div className="mt-6 flex flex-wrap gap-2">{SCHED_TABS.map((t, i) =><button key={t} onClick={() => setTab(i)} className="rounded-full px-4 py-2 text-sm font-medium" style={tab === i ? { background: "var(--brand-primary)", color: "var(--brand-on-primary)" } : { background: "#F3F4F6" }}>{t}</button>)}</div>
            <div className="mt-6 divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10">
              {events.map((e, i) => (
                <div key={e.id} className="flex items-center justify-between px-5 py-4"><div><p className="font-semibold">{e.title}</p><p className="text-sm text-black/50">{e.location}</p></div><span className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>{e.date}</span></div>
              ))}
            </div>
          </section>
        ),
        services: (
          <section className="bg-[#FBF7FC]">
            <div className="mx-auto max-w-6xl px-5 py-16">
              <h2 className="text-center text-3xl font-bold">{heading(siteData, "services", "We Bring The Best Things for You")}</h2>
              {subheading(siteData, "services", "") && <p className="mx-auto mt-3 max-w-xl text-center text-black/60">{subheading(siteData, "services", "")}</p>}
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {featItems.map((f, i) => {
                  const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                  return (
                    <div key={f.id} className="rounded-2xl bg-white p-6 text-center shadow-sm"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}><Icon className="h-6 w-6" /></span><h3 className="mt-3 font-semibold">{f.title}</h3>{f.description && <p className="mt-1 text-sm text-black/60">{f.description}</p>}</div>
                  );
                })}
              </div>
            </div>
          </section>
        ),
        testimonials: (
          <section className="bg-[#1A0533] text-white">
            <div className="mx-auto max-w-3xl px-5 py-16 text-center">
              <h2 className="text-3xl font-bold">{heading(siteData, "testimonials", "What Clients Say About Us")}</h2>
              <div className="mt-6 flex justify-center gap-1" style={{ color: "var(--brand-primary)" }}>{[0,1,2,3,4].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              {testimonialsOf(siteData).slice(0, 1).map((t, i) => (
                <div key={i}>
                  <blockquote className="mt-4 text-lg text-white/80">{t.quote}</blockquote>
                  <p className="mt-4 font-semibold">{t.name}</p>{t.role ? <p className="text-sm text-white/50">{t.role}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ),
        register: siteData.contactForm !== false ? (
          <section id="register" className="mx-auto max-w-xl px-5 py-16">
            <h2 className="text-center text-3xl font-bold">{heading(siteData, "register", "Register Here to Attend")}</h2>
            <div className="mt-8">
              <ContactFormV2 submitText="Register" source="register" message={false} options={events.map((e) => e.title)} optionLabel="Select event" />
            </div>
          </section>
        ) : null,
      }} />
      <CustomSections sections={siteData.customSections} at="bottom" />
      <footer className="bg-[#1A0533] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2"><p className="text-lg font-bold">{name}</p><p className="mt-2 max-w-xs text-sm text-white/50">Bringing the world together, one event at a time.</p></div>
          {[["Pages", ["Home", "Events", "Speakers"]], ["Company", ["About", "Careers", "Press"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="text-sm font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-sm text-white/50">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="flex justify-center pb-3 pt-1"><SocialIcons social={siteData.social} className="opacity-70" /></div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
