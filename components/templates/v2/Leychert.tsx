"use client";

import { Search, Mail, Phone, FileText, PhoneCall, Users, Home as HomeIcon, Scale, MapPin, ArrowRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, BrandButton, Img, heading, subheading, navItems, CustomSections, OrderedSections } from "./shared";
import { DonationSection } from "./DonationSection";

const QUICK = [
  { icon: FileText, t: "Services & Forms" }, { icon: PhoneCall, t: "Useful Numbers" },
  { icon: Users, t: "Associations" }, { icon: HomeIcon, t: "Family Portal" }, { icon: Scale, t: "Legal Publications" },
];
const QUICK_ICONS = [FileText, PhoneCall, Users, HomeIcon, Scale];

export function Leychert({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Leychert";
  const events = siteData.events || [];
  const overlay = siteData.heroOverlayColor || "#000000";
  const quickItems = siteData.quickActions?.length ? siteData.quickActions : QUICK.map((q, i) => ({ id: `q${i}`, title: q.t, description: "" }));
  const newsBtn = siteData.sectionButtons?.news || {};
  const eventsBtn = siteData.sectionButtons?.events || {};
  const territoryBtn = siteData.sectionButtons?.territory || {};
  const heroLinks = [
    { Icon: Search, href: "#quick" },
    { Icon: Mail, href: siteData.email ? `mailto:${siteData.email}` : "#" },
    { Icon: Phone, href: siteData.phone ? `tel:${siteData.phone.replace(/\s+/g, "")}` : "#" },
  ];

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div><Brandmark siteData={siteData} name={name} className="text-lg font-bold leading-none" /><p className="text-[10px] text-black/40">Community & Region</p></div>
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{navItems(siteData, [["About","#news"],["Living Here","#events"],["Heritage","#territory"],["Services","#quick"]]).map(([l, h]) => <a key={l} href={h}>{l}</a>)}</nav>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "quick", "news", "events", "territory", "donation"]} blocks={{
        donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
        hero: (
          <section className="relative">
            <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to top, ${overlay}B3, ${overlay}4D, transparent)` }} />
            <div className="relative mx-auto max-w-4xl px-5 py-32 text-center text-white">
              <h1 className="font-serif text-5xl font-bold italic sm:text-6xl">{siteData.heroHeadline || name}</h1>
              <p className="mt-3 text-white/80">{siteData.heroSubtext}</p>
              <div className="mt-6 flex justify-center gap-3">
                {heroLinks.map(({ Icon, href }, i) => (
                  <a key={i} href={href} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30"><Icon className="h-5 w-5" /></a>
                ))}
              </div>
            </div>
          </section>
        ),
        quick: (
          <section id="quick" className="mx-auto max-w-6xl px-5 py-14">
            {siteData.sectionTitles?.quick && <h2 className="mb-2 text-center font-serif text-3xl font-bold italic">{siteData.sectionTitles.quick}</h2>}
            {subheading(siteData, "quick", "") && <p className="mx-auto mb-8 max-w-xl text-center text-black/60">{subheading(siteData, "quick", "")}</p>}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {quickItems.map((q, i) => {
                const Icon = QUICK_ICONS[i % QUICK_ICONS.length];
                return (
                  <div key={q.id} className="flex flex-col items-center gap-3 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border-2" style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}><Icon className="h-6 w-6" /></span><span className="text-sm font-semibold">{q.title}</span></div>
                );
              })}
            </div>
          </section>
        ),
        news: (
          <section id="news" className="mx-auto max-w-6xl px-5 py-14">
            <div className="grid gap-8 lg:grid-cols-[40%_60%]">
              <div className="min-w-0">
                <h2 className="font-serif text-4xl font-bold italic">{heading(siteData, "news", "News")}</h2>
                {subheading(siteData, "news", "") && <p className="mt-2 text-black/60">{subheading(siteData, "news", "")}</p>}
                {(newsBtn.text ?? "View All News") && <BrandButton as="a" href={newsBtn.url?.trim() || "#"} className="mt-4">{newsBtn.text || "View All News"}</BrandButton>}
                {events[0] && (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-black/10"><Img src={events[0].image} className="aspect-[16/9] w-full object-cover" /><div className="p-5"><span className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>{events[0].date}</span><h3 className="mt-1 font-semibold break-words">{events[0].title}</h3><p className="mt-1 text-sm text-black/60 break-words">{events[0].description}</p>{(() => { const l = events[0].linkUrl?.trim(); return <a href={l || "#"} {...(l ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-2 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Read More →</a>; })()}</div></div>
                )}
              </div>
              <div className="min-w-0 divide-y divide-black/5">
                {events.map((e) => {
                  const l = e.linkUrl?.trim();
                  return (
                    <div key={e.id} className="flex gap-4 py-4"><span className="h-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: "var(--brand-primary)" }}>{e.date}</span><div className="min-w-0"><h3 className="font-semibold break-words">{e.title}</h3><p className="text-sm text-black/60 break-words">{e.description}</p><a href={l || "#"} {...(l ? { target: "_blank", rel: "noreferrer" } : {})} className="text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Read More →</a></div></div>
                  );
                })}
              </div>
            </div>
          </section>
        ),
        events: (
          <section id="events" className="bg-[#FBF8F3]">
            <div className="mx-auto max-w-6xl px-5 py-14">
              <div className="grid gap-8 lg:grid-cols-[30%_70%]">
                <div className="min-w-0"><h2 className="font-serif text-4xl font-bold italic">{heading(siteData, "events", "Events")}</h2><p className="mt-3 text-black/60">{subheading(siteData, "events", "Discover what's happening across the community.")}</p>{(eventsBtn.text ?? "All Events") && <BrandButton as="a" href={eventsBtn.url?.trim() || "#"} className="mt-4">{eventsBtn.text || "All Events"}</BrandButton>}</div>
                <div className="flex gap-5 overflow-x-auto pb-2">
                  {events.map((e) => {
                    const l = e.linkUrl?.trim();
                    return (
                      <div key={e.id} className="w-64 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
                        <div className="relative"><Img src={e.image} className="aspect-[4/3] w-full object-cover" /><span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-xs font-bold">{e.date}</span></div>
                        <div className="p-4"><h3 className="font-semibold break-words">{e.title}</h3><a href={l || "#"} {...(l ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-1 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>Read More →</a></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ),
        territory: (
          <section id="territory" className="relative">
            <Img src={siteData.sectionImages?.territory || "https://picsum.photos/seed/ley-territory/1200/600"} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: `${siteData.sectionColors?.territory || "#000000"}8C` }} />
            <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 py-20 text-white lg:grid-cols-2">
              <div className="min-w-0"><h2 className="font-serif text-4xl font-bold italic">{heading(siteData, "territory", "The Territory")}</h2><p className="mt-3 max-w-md text-white/80">{subheading(siteData, "territory", "Explore the towns, landmarks and natural beauty that make our region home.")}</p>{(territoryBtn.text ?? "View Interactive Map") && <a href={territoryBtn.url?.trim() || "#"} {...(territoryBtn.url?.trim() ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/50 px-6 py-3 text-sm font-semibold">{territoryBtn.text || "View Interactive Map"} <ArrowRight className="h-4 w-4" /></a>}</div>
              <div className="flex justify-center"><MapPin className="h-24 w-24 text-white/60" /></div>
            </div>
          </section>
        ),
      }} />
      <CustomSections sections={siteData.customSections} at="bottom" />
      <footer className="bg-[#1A1208] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
          <div><p className="text-lg font-bold">{name}</p><p className="mt-2 text-sm text-white/50">{siteData.address || "Town Hall, Main Street"}</p></div>
          <div><h4 className="text-sm font-semibold">Opening Hours</h4><ul className="mt-3 space-y-1 text-sm text-white/50"><li>Mon to Fri: 8:00 to 17:00</li><li>Sat: 9:00 to 13:00</li></ul></div>
          <div><h4 className="text-sm font-semibold">Contact</h4><p className="mt-3 text-sm text-white/50">{siteData.phone || "+234 800 000 0000"}<br />{siteData.email || "hello@leychert.gov"}</p></div>
        </div>
        <div className="flex justify-center pb-3 pt-1"><SocialIcons social={siteData.social} className="opacity-70" /></div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
