"use client";

import { useState, useEffect } from "react";
import { Phone, Mail, ArrowRight, Quote } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, BrandButton, Img, heading, subheading, navItems, headerCta, CustomSections, OrderedSections } from "./shared";
import { DonationSection } from "./DonationSection";

const MINISTRIES = [
  ["Education Ministry", "Equipping every generation with the Word."],
  ["Children Ministry", "A safe, joyful place for kids to grow."],
  ["Parent Ministry", "Supporting families at every stage."],
  ["Teacher Ministry", "Training and encouraging our teachers."],
];

/** Live countdown shown in the top bar once a target date is set. */
function Countdown({ label, date }: { label?: string; date?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!date) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [date]);

  const target = date ? new Date(date).getTime() : NaN;
  const live = now != null && !isNaN(target) && target > now;
  if (!live) return <span className="font-semibold uppercase">{label || "Upcoming Event"}</span>;
  const diff = target - now!;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return <span className="font-semibold uppercase">{label ? `${label}: ` : ""}{days} Days · {hours} Hours · {mins} Mins</span>;
}

export function DeedsChurch({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Deeds";
  const overlay = siteData.heroOverlayColor || "#000000";
  const heroBtn = siteData.sectionButtons?.hero || {};
  const aboutBtn = siteData.sectionButtons?.about || {};
  const ministriesBtn = siteData.sectionButtons?.ministries || {};
  const aboutImgs = siteData.aboutImages?.length ? siteData.aboutImages : [{ id: "a0", name: "", image: "https://picsum.photos/seed/deeds-a1/500/600" }, { id: "a1", name: "", image: "https://picsum.photos/seed/deeds-a2/300/300" }];
  const sinceYear = siteData.sectionText?.aboutSince || "1996";
  const aboutQuote = siteData.sectionText?.aboutQuote || "Faith, hope and love — and the greatest of these is love.";
  const ministryCards = siteData.portfolioItems?.length ? siteData.portfolioItems : MINISTRIES.map(([title, description], i) => ({ id: `dm${i}`, title, category: "", description, image: `https://picsum.photos/seed/deeds-min${i}/500/300`, linkUrl: "" }));

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <div className="text-white" style={{ background: "var(--brand-primary)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-2 text-xs sm:flex-row">
          <Countdown label={siteData.countdownLabel || "Upcoming Event"} date={siteData.countdownDate} />
          <span className="flex items-center gap-4"><span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {siteData.phone || "+234 800 000"}</span><span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {siteData.email || "hello@deeds.org"}</span></span>
        </div>
      </div>
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-6 text-sm text-black/60 lg:flex">{navItems(siteData, [["Home","#"],["Sermons","#about"],["Events","#ministries"],["Stories","#ministries"],["About","#about"]]).map(([l, h]) => <a key={l} href={h}>{l}</a>)}</nav>
          {(() => { const c = headerCta(siteData, "Donate Now"); return <BrandButton as="a" href={c.href} className="px-4 py-2">{c.text}</BrandButton>; })()}
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "about", "ministries", "donation"]} blocks={{
        donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
        hero: (
          <section className="relative">
            <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: `${overlay}8C` }} />
            <div className="relative mx-auto max-w-3xl px-5 py-28 text-center text-white">
              {(siteData.sectionEyebrows?.hero ?? `New to ${name}?`) && <span className="text-xs uppercase tracking-widest text-white/60">{siteData.sectionEyebrows?.hero ?? `New to ${name}?`}</span>}
              <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">{siteData.heroHeadline}</h1>
              {(heroBtn.text ?? "Plan Your Visit") && <a href={heroBtn.url?.trim() || "#"} {...(heroBtn.url?.trim() ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-6 inline-block rounded-md border-2 border-white px-6 py-3 text-sm font-semibold uppercase">{heroBtn.text || "Plan Your Visit"}</a>}
            </div>
          </section>
        ),
        about: (
          <section id="about" className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[40%_60%]">
            <div className="relative">
              <Img src={aboutImgs[0]?.image} className="aspect-[5/6] w-full rounded-2xl object-cover" />
              {aboutImgs[1] && <Img src={aboutImgs[1].image} className="absolute -bottom-6 -right-4 h-32 w-32 rounded-2xl border-4 border-white object-cover" />}
              {sinceYear && <div className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-center"><p className="text-xs text-black/50">Since</p><p className="text-2xl font-bold">{sinceYear}</p></div>}
            </div>
            <div>
              {(siteData.sectionEyebrows?.about ?? "Work of the Church") && <span className="text-sm font-semibold uppercase" style={{ color: "var(--brand-primary)" }}>{siteData.sectionEyebrows?.about ?? "Work of the Church"}</span>}
              <h2 className="mt-2 text-3xl font-bold">{heading(siteData, "sermons", "We Preach the Gospel in Every Sermon")}</h2>
              <p className="mt-3 text-black/60">{subheading(siteData, "sermons", siteData.heroSubtext || "")}</p>
              {aboutQuote && <blockquote className="mt-5 border-l-4 pl-4 text-black/70" style={{ borderColor: "var(--brand-primary)" }}><Quote className="mb-1 h-5 w-5" style={{ color: "var(--brand-primary)" }} />{aboutQuote}</blockquote>}
              {(aboutBtn.text ?? "About The Church") && <BrandButton as="a" href={aboutBtn.url?.trim() || "#"} className="mt-5">{aboutBtn.text || "About The Church"} <ArrowRight className="h-4 w-4" /></BrandButton>}
            </div>
          </section>
        ),
        ministries: (
          <section id="ministries" className="bg-[#F5F5F5]">
            <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-16 lg:grid-cols-[40%_60%]">
              <div>
                <h2 className="text-3xl font-bold">{heading(siteData, "ministries", "Explore Our Church Ministries")}</h2>
                <p className="mt-3 text-black/60">{subheading(siteData, "ministries", "There is a place for everyone to belong, serve and grow.")}</p>
                {(ministriesBtn.text ?? "All Church Ministries") && <a href={ministriesBtn.url?.trim() || "#"} {...(ministriesBtn.url?.trim() ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-4 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>{ministriesBtn.text || "All Church Ministries"} →</a>}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {ministryCards.map((m) => {
                  const link = m.linkUrl?.trim();
                  return (
                    <div key={m.id} className="overflow-hidden rounded-2xl bg-white shadow-sm"><Img src={m.image} className="aspect-[5/3] w-full object-cover" /><div className="p-5"><h3 className="font-semibold">{m.title}</h3>{m.description && <p className="mt-1 text-sm text-black/60">{m.description}</p>}<a href={link || "#"} {...(link ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-2 inline-block text-sm font-semibold" style={{ color: "var(--brand-primary)" }}>→ Read More</a></div></div>
                  );
                })}
              </div>
            </div>
          </section>
        ),
      }} />
      <CustomSections sections={siteData.customSections} at="bottom" />
      <footer className="border-t border-black/5">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div><p className="text-lg font-bold">{name}</p><p className="mt-2 text-black/50">A place to grow in faith and community.</p></div>
          {[["Explore", ["Sermons", "Events", "Stories"]], ["Connect", ["Visit", "Groups", "Give"]], ["Contact", [siteData.phone || "+234 800 000", siteData.email || "hello@deeds.org"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-black/50">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="flex justify-center pb-3 pt-1"><SocialIcons social={siteData.social} className="opacity-70" /></div>
        <div className="border-t border-black/5 py-5 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
