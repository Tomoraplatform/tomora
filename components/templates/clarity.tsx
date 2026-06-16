"use client";

import { Star, Users, Award, Check, Phone, Mail, MapPin } from "lucide-react";
import { contrastText } from "@/lib/utils";
import { Editable } from "./editable";
import { ContactForm, TemplateProps, blockContent, hasBlock } from "./shared";

export function Clarity({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Your Business";
  const onBrand = contrastText(brandColor);
  const hero = blockContent(siteData, "hero");
  const stats = blockContent(siteData, "stats");
  const services = blockContent(siteData, "services");
  const about = blockContent(siteData, "about");
  const testi = blockContent(siteData, "testimonials");
  const contact = blockContent(siteData, "contact");

  const statIcons = [Star, Users, Award];

  return (
    <div className="bg-white font-sans text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold tracking-tight">{name}</span>
          <nav className="hidden gap-7 text-sm text-slate-600 md:flex">
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <a
            href="#contact"
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{ background: brandColor, color: onBrand }}
          >
            {hero.ctaText || "Get in Touch"}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(120deg, ${brandColor}, ${brandColor}cc)` }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center" style={{ color: onBrand }}>
          <Editable as="h1" blockId="hero" field="headline" value={hero.headline || name}
            className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl" />
          <Editable as="p" blockId="hero" field="subheadline" value={hero.subheadline || ""}
            className="mx-auto mt-5 max-w-xl text-lg opacity-90" />
          <a href="#contact" className="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900">
            {hero.ctaText || "Get Started"}
          </a>
        </div>
      </section>

      {/* Stats */}
      {hasBlock(siteData, "stats") && (
        <section className="border-b border-slate-100 bg-slate-50">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-5 py-12 sm:grid-cols-3">
            {(stats.items || []).map((s: any, i: number) => {
              const Icon = statIcons[i % statIcons.length];
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <Icon className="mb-2 h-6 w-6" style={{ color: brandColor }} />
                  <span className="text-3xl font-bold">{s.value}</span>
                  <span className="text-sm text-slate-500">{s.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Services */}
      {hasBlock(siteData, "services") && (
        <section id="services" className="mx-auto max-w-6xl px-5 py-20">
          <Editable as="h2" blockId="services" field="title" value={services.title || "What We Do"}
            className="text-center text-3xl font-bold" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(services.items || []).map((s: any, i: number) => (
              <div key={i} className="rounded-xl border border-slate-100 p-6 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{ background: `${brandColor}15`, color: brandColor }}>
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      {hasBlock(siteData, "about") && (
        <section id="about" className="bg-slate-50">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
            <div>
              <Editable as="h2" blockId="about" field="title" value={about.title || "About Us"}
                className="text-3xl font-bold" />
              <Editable as="p" blockId="about" field="body" value={about.body || ""} multiline
                className="mt-4 leading-relaxed text-slate-600" />
            </div>
            <div className="aspect-[4/3] rounded-2xl" style={{ background: `${brandColor}22` }} />
          </div>
        </section>
      )}

      {/* Testimonials */}
      {hasBlock(siteData, "testimonials") && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Editable as="h2" blockId="testimonials" field="title" value={testi.title || "What People Say"}
            className="text-center text-3xl font-bold" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(testi.items || []).map((t: any, i: number) => (
              <figure key={i} className="rounded-xl border border-slate-100 p-6">
                <div className="mb-3 flex gap-0.5" style={{ color: brandColor }}>
                  {[0,1,2,3,4].map((n) => <Star key={n} className="h-4 w-4 fill-current" />)}
                </div>
                <blockquote className="text-sm text-slate-600">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{t.name}<span className="font-normal text-slate-400"> — {t.role}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      {hasBlock(siteData, "contact") && (
        <section id="contact" className="bg-slate-50">
          <div className="mx-auto max-w-4xl px-5 py-20">
            <Editable as="h2" blockId="contact" field="title" value={contact.title || "Get in Touch"}
              className="text-center text-3xl font-bold" />
            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-slate-600">
              {siteData.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4" />{siteData.phone}</span>}
              {siteData.email && <span className="flex items-center gap-2"><Mail className="h-4 w-4" />{siteData.email}</span>}
              {siteData.address && <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{siteData.address}</span>}
            </div>
            <div className="mt-10">
              <ContactForm accent={brandColor} buttonText={onBrand} />
            </div>
          </div>
        </section>
      )}

      <Footer name={name} brandColor={brandColor} />
    </div>
  );
}

function Footer({ name, brandColor }: { name: string; brandColor: string }) {
  return (
    <footer className="py-10 text-center text-sm" style={{ background: brandColor, color: contrastText(brandColor) }}>
      <div className="opacity-90">{name}</div>
      <div className="mt-1 opacity-60">Built with Tomora</div>
    </footer>
  );
}
