"use client";

import { Search, Play, HandHeart, Users, CalendarDays, Plus, Phone, MapPin, Mail } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, Img } from "./shared";

const QUICK = [{ icon: Play, t: "Watch" }, { icon: HandHeart, t: "Give" }, { icon: Users, t: "Who We Are" }, { icon: CalendarDays, t: "Events" }];
const MINISTRIES = ["Missional Communities", "Previous Sermons", "Our Weddings", "Special Events"];

export function BellevueChurch({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Bellevue";
  const events = siteData.events || [];

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <div className="bg-[#1A1208] py-2 text-xs text-white/70"><div className="mx-auto flex max-w-6xl items-center gap-5 px-5"><span className="flex items-center gap-1"><Play className="h-3 w-3" /> Media</span><span className="flex items-center gap-1"><Mail className="h-3 w-3" /> Contact Us</span></div></div>
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-lg font-bold" />
          <nav className="hidden gap-5 text-sm text-black/60 lg:flex">{["Belong & Grow", "Mission & Serve", "Prayer & Care", "Worship & Music", "Giving"].map((l) => <a key={l} href="#">{l}</a>)}</nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <Img src={siteData.heroImage} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#1A1208]/70" />
        <div className="relative mx-auto max-w-3xl px-5 py-28 text-center text-white">
          <h1 className="text-4xl font-bold uppercase sm:text-5xl">{siteData.heroHeadline}</h1>
          <p className="mt-3 text-lg font-semibold" style={{ color: "var(--brand-primary)" }}>What can we help you find?</p>
          <div className="mx-auto mt-6 flex max-w-md items-center rounded-full bg-white px-4 py-2"><input className="flex-1 bg-transparent text-sm text-neutral-900 outline-none" placeholder="Search..." /><Search className="h-4 w-4 text-black/40" /></div>
          <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK.map(({ icon: Icon, t }) => (
              <div key={t} className="flex flex-col items-center gap-2 rounded-xl bg-white/10 py-4 backdrop-blur"><Icon className="h-6 w-6" style={{ color: "var(--brand-primary)" }} /><span className="text-sm">{t}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center"><p className="text-xl leading-relaxed text-black/70">{siteData.heroSubtext} We are a community committed to faith, hope and love — come as you are and grow with us.</p></section>

      {/* Ministry grid */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {MINISTRIES.map((m, i) => (
            <a key={m} href="#" className="group relative aspect-[16/9] overflow-hidden rounded-2xl">
              <Img src={`https://picsum.photos/seed/bel-min${i}/900/500`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/45" />
              <span className="absolute left-5 bottom-5 text-lg font-semibold text-white">{m}</span>
              <span className="absolute right-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90"><Plus className="h-5 w-5" /></span>
            </a>
          ))}
        </div>
      </section>

      {/* What's new */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-bold uppercase" style={{ color: "var(--brand-primary)" }}>What&apos;s New at {name}</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-black/40">Featured Event</p>
            {events[0] && (<div className="mt-2 overflow-hidden rounded-2xl border border-black/10"><Img src={events[0].image} className="aspect-[16/9] w-full object-cover" /><div className="p-5"><h3 className="font-semibold">{events[0].title}</h3><p className="text-sm text-black/50">{events[0].date} · {events[0].location}</p></div></div>)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-black/40">The Messenger Blog</p>
            <div className="mt-2 space-y-4">
              {events.slice(1).map((e) => (
                <div key={e.id} className="flex gap-4 border-b border-black/5 pb-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-white" style={{ background: "var(--brand-primary)" }}><span className="text-xs">{e.date.split(" ")[0]}</span><span className="text-sm font-bold">{e.date.split(" ")[1]}</span></div>
                  <div><h3 className="font-semibold">{e.title}</h3><p className="text-sm text-black/50">{e.description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#0D0D0D] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
          <div><h4 className="text-sm font-semibold">Quick Links</h4><ul className="mt-3 space-y-2 text-sm text-white/50"><li>About</li><li>Sermons</li><li>Give</li><li>Events</li></ul></div>
          <div><h4 className="text-sm font-semibold">Worship Times</h4><ul className="mt-3 space-y-2 text-sm text-white/50"><li>Sunday 9:00 AM</li><li>Sunday 11:00 AM</li></ul></div>
          <div><h4 className="text-sm font-semibold">Visit Us</h4><p className="mt-3 space-y-1 text-sm text-white/50"><span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {siteData.address || "Lagos, Nigeria"}</span><span className="mt-1 flex items-center gap-2"><Phone className="h-4 w-4" /> {siteData.phone || "+234 800 000 0000"}</span></p></div>
        </div>
        <div className="flex justify-center pb-3 pt-1"><SocialIcons social={siteData.social} className="opacity-70" /></div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
