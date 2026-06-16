"use client";

import { Youtube, Podcast, Music, Play, ArrowRight } from "lucide-react";
import { contrastText } from "@/lib/utils";
import { Editable } from "./editable";
import { TemplateProps, blockContent, hasBlock } from "./shared";

export function Studio({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "The Studio";
  const onBrand = contrastText(brandColor);
  const hero = blockContent(siteData, "hero");
  const services = blockContent(siteData, "services");
  const stats = blockContent(siteData, "stats");
  const cta = blockContent(siteData, "cta");
  const testi = blockContent(siteData, "testimonials");

  return (
    <div className="bg-[#0d0d0d] font-sans text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold">{name}</span>
          <nav className="flex items-center gap-4 text-white/60">
            <a href="#" aria-label="Spotify"><Music className="h-5 w-5" /></a>
            <a href="#" aria-label="Apple Podcasts"><Podcast className="h-5 w-5" /></a>
            <a href="#" aria-label="YouTube"><Youtube className="h-5 w-5" /></a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 30% 20%, ${brandColor}, transparent 55%)` }} />
        <div className="relative mx-auto max-w-4xl px-5 py-28 text-center">
          <Editable as="h1" blockId="hero" field="headline" value={hero.headline || name}
            className="text-5xl font-extrabold leading-tight sm:text-7xl" />
          <Editable as="p" blockId="hero" field="subheadline" value={hero.subheadline || ""}
            className="mx-auto mt-5 max-w-xl text-lg text-white/60" />
          <button className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
            style={{ background: brandColor, color: onBrand }}>
            {hero.ctaText || "Subscribe"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Episode/content grid */}
      {hasBlock(siteData, "services") && (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <Editable as="h2" blockId="services" field="title" value={services.title || "Latest Episodes"} className="text-3xl font-bold" />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {(services.items || []).map((s: any, i: number) => (
              <div key={i} className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="relative flex aspect-video items-center justify-center" style={{ background: `linear-gradient(135deg, ${brandColor}55, #0d0d0d)` }}>
                  <Play className="h-10 w-10 text-white/90" />
                </div>
                <div className="p-5">
                  <span className="text-xs text-white/40">Episode {i + 1}</span>
                  <h3 className="mt-1 font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-white/50">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats bar */}
      {hasBlock(siteData, "stats") && (
        <section className="border-y border-white/10">
          <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6 px-5 py-12 text-center">
            {(stats.items || []).map((s: any, i: number) => (
              <div key={i}>
                <div className="text-4xl font-extrabold" style={{ color: brandColor }}>{s.value}</div>
                <div className="mt-1 text-sm text-white/50">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      {hasBlock(siteData, "cta") && (
        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <Editable as="h2" blockId="cta" field="headline" value={cta.headline || "Join the newsletter"} className="text-3xl font-bold" />
          <Editable as="p" blockId="cta" field="body" value={cta.body || ""} className="mx-auto mt-3 max-w-md text-white/60" />
          <div className="mx-auto mt-6 flex max-w-md gap-2">
            <input className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm outline-none" placeholder="you@email.com" />
            <button className="rounded-full px-6 py-3 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>{cta.buttonText || "Subscribe"}</button>
          </div>
        </section>
      )}

      {/* Testimonials carousel */}
      {hasBlock(siteData, "testimonials") && (
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="flex gap-6 overflow-x-auto pb-2">
              {(testi.items || []).map((t: any, i: number) => (
                <figure key={i} className="w-80 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <blockquote className="text-white/70">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-4 text-sm font-semibold">{t.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="py-8 text-center text-sm text-white/40">{name} — Built with Tomora</footer>
    </div>
  );
}
