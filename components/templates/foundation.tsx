"use client";

import { GraduationCap, BookOpen, Users, Calendar, ArrowRight } from "lucide-react";
import { contrastText } from "@/lib/utils";
import { Editable } from "./editable";
import { TemplateProps, blockContent, hasBlock } from "./shared";

const BASE = "#0a2540";

export function Foundation({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "The Institution";
  const onBrand = contrastText(brandColor);
  const hero = blockContent(siteData, "hero");
  const services = blockContent(siteData, "services");
  const about = blockContent(siteData, "about");
  const stats = blockContent(siteData, "stats");
  const cta = blockContent(siteData, "cta");
  const progIcons = [GraduationCap, BookOpen, Users];
  const events = [
    { date: "Sat, 12", title: "Community Gathering" },
    { date: "Sun, 20", title: "Open Day & Tours" },
    { date: "Fri, 28", title: "Annual Fundraiser" },
  ];

  return (
    <div className="bg-white font-sans" style={{ color: BASE }}>
      <header className="sticky top-0 z-20 text-white" style={{ background: BASE }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold">{name}</span>
          <nav className="hidden gap-6 text-sm text-white/70 md:flex">
            <a href="#programs">Programs</a><a href="#about">About</a><a href="#events">Events</a>
          </nav>
          <a href="#cta" className="rounded-md px-5 py-2 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>Give</a>
        </div>
      </header>

      {/* Photo hero with overlay + dual CTAs */}
      <section className="relative flex min-h-[70vh] items-center text-white" style={{ background: `linear-gradient(rgba(10,37,64,0.82), rgba(10,37,64,0.92))` }}>
        <div className="absolute inset-0 -z-10" style={{ background: `linear-gradient(135deg, ${BASE}, #11365c)` }} />
        <div className="mx-auto w-full max-w-5xl px-5 py-24 text-center">
          <Editable as="h1" blockId="hero" field="headline" value={hero.headline || name}
            className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-6xl" />
          <Editable as="p" blockId="hero" field="subheadline" value={hero.subheadline || ""}
            className="mx-auto mt-5 max-w-xl text-lg text-white/80" />
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#cta" className="rounded-md px-6 py-3 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>
              {hero.ctaText || "Donate"}
            </a>
            <a href="#programs" className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white">Explore Programs</a>
          </div>
        </div>
      </section>

      {/* Programs grid */}
      {hasBlock(siteData, "services") && (
        <section id="programs" className="mx-auto max-w-6xl px-5 py-20">
          <Editable as="h2" blockId="services" field="title" value={services.title || "Our Programs"} className="text-center text-3xl font-bold" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(services.items || []).map((s: any, i: number) => {
              const Icon = progIcons[i % progIcons.length];
              return (
                <div key={i} className="rounded-xl border border-black/10 p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: `${brandColor}1a`, color: brandColor }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-black/60">{s.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* About */}
      {hasBlock(siteData, "about") && (
        <section id="about" className="bg-slate-50">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
            <div className="aspect-[4/3] rounded-2xl" style={{ background: `${BASE}18` }} />
            <div>
              <Editable as="h2" blockId="about" field="title" value={about.title || "About Us"} className="text-3xl font-bold" />
              <Editable as="p" blockId="about" field="body" value={about.body || ""} multiline className="mt-4 leading-relaxed text-black/60" />
            </div>
          </div>
        </section>
      )}

      {/* Events list */}
      <section id="events" className="mx-auto max-w-4xl px-5 py-20">
        <h2 className="text-3xl font-bold">Upcoming Events</h2>
        <ul className="mt-8 divide-y divide-black/10">
          {events.map((e, i) => (
            <li key={i} className="flex items-center gap-5 py-5">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-white" style={{ background: BASE }}>
                <Calendar className="h-4 w-4" />
                <span className="text-xs">{e.date}</span>
              </div>
              <span className="font-medium">{e.title}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-black/30" />
            </li>
          ))}
        </ul>
      </section>

      {/* CTA band */}
      {hasBlock(siteData, "cta") && (
        <section id="cta" className="px-5 py-16 text-center" style={{ background: brandColor, color: onBrand }}>
          <Editable as="h2" blockId="cta" field="headline" value={cta.headline || "Support our work"} className="text-3xl font-bold" />
          <Editable as="p" blockId="cta" field="body" value={cta.body || ""} className="mx-auto mt-3 max-w-md opacity-90" />
          <button className="mt-6 rounded-md px-7 py-3 text-sm font-semibold text-white" style={{ background: BASE }}>{cta.buttonText || "Donate Now"}</button>
        </section>
      )}

      {/* Stats bar */}
      {hasBlock(siteData, "stats") && (
        <section className="text-white" style={{ background: BASE }}>
          <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6 px-5 py-12 text-center">
            {(stats.items || []).map((s: any, i: number) => (
              <div key={i}>
                <div className="text-3xl font-bold" style={{ color: brandColor }}>{s.value}</div>
                <div className="mt-1 text-sm text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Multi-column footer */}
      <footer className="text-white" style={{ background: "#07192c" }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-4">
          <div>
            <div className="font-bold">{name}</div>
            <p className="mt-2 text-sm text-white/50">Serving our community with purpose.</p>
          </div>
          {["Programs", "About", "Contact"].map((c) => (
            <div key={c}>
              <h4 className="text-sm font-semibold text-white/80">{c}</h4>
              <ul className="mt-3 space-y-2 text-sm text-white/50">
                <li>Link one</li><li>Link two</li><li>Link three</li>
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 py-5 text-center text-sm text-white/40">Built with Tomora</div>
      </footer>
    </div>
  );
}
