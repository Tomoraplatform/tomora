"use client";

import { ArrowRight, Briefcase, Star } from "lucide-react";
import { contrastText } from "@/lib/utils";
import { Editable } from "./editable";
import { TemplateProps, blockContent, hasBlock } from "./shared";

export function Prestige({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Your Business";
  const onBrand = contrastText(brandColor);
  const hero = blockContent(siteData, "hero");
  const about = blockContent(siteData, "about");
  const services = blockContent(siteData, "services");
  const cta = blockContent(siteData, "cta");
  const testi = blockContent(siteData, "testimonials");

  return (
    <div className="bg-[#141414] font-sans text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#1a1a1a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold tracking-wide" style={{ color: brandColor }}>{name}</span>
          <nav className="hidden gap-7 text-sm text-white/70 md:flex">
            <a href="#about">About</a><a href="#services">Services</a><a href="#reviews">Reviews</a>
          </nav>
          <a href="#cta" className="rounded-sm px-4 py-2 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>
            {hero.ctaText || "Enquire"}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#222] to-black" />
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 70% 30%, ${brandColor}, transparent 60%)` }} />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-24">
          <span className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: brandColor }}>{name}</span>
          <Editable as="h1" blockId="hero" field="headline" value={hero.headline || name}
            className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-6xl" />
          <Editable as="p" blockId="hero" field="subheadline" value={hero.subheadline || ""}
            className="mt-5 max-w-lg text-lg text-white/70" />
          <a href="#cta" className="mt-8 inline-flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-semibold"
            style={{ background: brandColor, color: onBrand }}>
            {hero.ctaText || "Get Started"} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* About */}
      {hasBlock(siteData, "about") && (
        <section id="about" className="mx-auto max-w-4xl px-5 py-20 text-center">
          <Editable as="h2" blockId="about" field="title" value={about.title || "About"} className="text-3xl font-bold" />
          <Editable as="p" blockId="about" field="body" value={about.body || ""} multiline
            className="mx-auto mt-5 max-w-2xl leading-relaxed text-white/70" />
        </section>
      )}

      {/* Services list */}
      {hasBlock(siteData, "services") && (
        <section id="services" className="border-y border-white/10 bg-[#1a1a1a]">
          <div className="mx-auto max-w-4xl px-5 py-20">
            <Editable as="h2" blockId="services" field="title" value={services.title || "Services"} className="text-3xl font-bold" />
            <ul className="mt-10 divide-y divide-white/10">
              {(services.items || []).map((s: any, i: number) => (
                <li key={i} className="flex items-start gap-4 py-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm" style={{ background: `${brandColor}22`, color: brandColor }}>
                    <Briefcase className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-sm text-white/60">{s.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CTA band */}
      {hasBlock(siteData, "cta") && (
        <section id="cta" className="px-5 py-16 text-center" style={{ background: brandColor, color: onBrand }}>
          <Editable as="h2" blockId="cta" field="headline" value={cta.headline || "Ready?"} className="text-3xl font-bold" />
          <Editable as="p" blockId="cta" field="body" value={cta.body || ""} className="mx-auto mt-3 max-w-md opacity-90" />
          <button className="mt-6 rounded-sm bg-black/90 px-6 py-3 text-sm font-semibold text-white">{cta.buttonText || "Contact"}</button>
        </section>
      )}

      {/* Reviews */}
      {hasBlock(siteData, "testimonials") && (
        <section id="reviews" className="mx-auto max-w-6xl px-5 py-20">
          <Editable as="h2" blockId="testimonials" field="title" value={testi.title || "Reviews"} className="text-center text-3xl font-bold" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(testi.items || []).map((t: any, i: number) => (
              <figure key={i} className="rounded-lg border border-white/10 bg-[#1a1a1a] p-6">
                <div className="mb-3 flex gap-0.5" style={{ color: brandColor }}>
                  {[0,1,2,3,4].map((n) => <Star key={n} className="h-4 w-4 fill-current" />)}
                </div>
                <blockquote className="text-sm text-white/70">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/50">
        {name} — Built with Tomora
      </footer>
    </div>
  );
}
