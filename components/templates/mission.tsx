"use client";

import { HandHeart, Users, Megaphone, Heart, ArrowRight } from "lucide-react";
import { contrastText } from "@/lib/utils";
import { Editable } from "./editable";
import { TemplateProps, blockContent, hasBlock } from "./shared";

export function Mission({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Our Mission";
  const onBrand = contrastText(brandColor);
  const hero = blockContent(siteData, "hero");
  const stats = blockContent(siteData, "stats");
  const services = blockContent(siteData, "services");
  const cta = blockContent(siteData, "cta");
  const testi = blockContent(siteData, "testimonials");
  const helpIcons = [HandHeart, Users, Megaphone];
  const progresses = [72, 45, 90];

  return (
    <div className="bg-[#f3faf7] font-sans text-[#0c2a22]">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold">{name}</span>
          <nav className="hidden gap-6 text-sm text-[#0c2a22]/70 md:flex">
            <a href="#campaigns">Campaigns</a><a href="#help">Get Involved</a><a href="#cta">Donate</a>
          </nav>
          <a href="#cta" className="rounded-full px-5 py-2 text-sm font-semibold" style={{ background: brandColor, color: onBrand }}>Donate</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${brandColor}, ${brandColor}aa)` }} />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center" style={{ color: onBrand }}>
          <Editable as="h1" blockId="hero" field="headline" value={hero.headline || name}
            className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl" />
          <Editable as="p" blockId="hero" field="subheadline" value={hero.subheadline || ""}
            className="mx-auto mt-5 max-w-xl text-lg opacity-90" />
          <a href="#cta" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0c2a22]">
            {hero.ctaText || "Get Involved"} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Campaigns with progress */}
      {hasBlock(siteData, "stats") && (
        <section id="campaigns" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-center text-3xl font-bold">Our Campaigns</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(stats.items || []).map((s: any, i: number) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-semibold">{s.label}</h3>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#0c2a22]/10">
                  <div className="h-full rounded-full" style={{ width: `${progresses[i % 3]}%`, background: brandColor }} />
                </div>
                <div className="mt-2 flex justify-between text-sm text-[#0c2a22]/60">
                  <span>{progresses[i % 3]}% funded</span>
                  <span className="font-semibold" style={{ color: brandColor }}>{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How to help */}
      {hasBlock(siteData, "services") && (
        <section id="help" className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Editable as="h2" blockId="services" field="title" value={services.title || "How You Can Help"} className="text-center text-3xl font-bold" />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {(services.items || []).map((s: any, i: number) => {
                const Icon = helpIcons[i % helpIcons.length];
                return (
                  <div key={i} className="rounded-2xl border border-[#0c2a22]/10 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${brandColor}1a`, color: brandColor }}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-[#0c2a22]/60">{s.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Volunteer CTA band */}
      {hasBlock(siteData, "cta") && (
        <section id="cta" className="px-5 py-16 text-center" style={{ background: brandColor, color: onBrand }}>
          <Heart className="mx-auto mb-4 h-8 w-8" />
          <Editable as="h2" blockId="cta" field="headline" value={cta.headline || "Stand with us"} className="text-3xl font-bold" />
          <Editable as="p" blockId="cta" field="body" value={cta.body || ""} className="mx-auto mt-3 max-w-md opacity-90" />
          <button className="mt-6 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#0c2a22]">{cta.buttonText || "Donate Now"}</button>
        </section>
      )}

      {/* Testimonials */}
      {hasBlock(siteData, "testimonials") && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Editable as="h2" blockId="testimonials" field="title" value={testi.title || "Voices We Serve"} className="text-center text-3xl font-bold" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(testi.items || []).map((t: any, i: number) => (
              <figure key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                <blockquote className="text-sm text-[#0c2a22]/70">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <footer className="py-8 text-center text-sm" style={{ background: brandColor, color: onBrand }}>
        {name} — Built with Tomora
      </footer>
    </div>
  );
}
