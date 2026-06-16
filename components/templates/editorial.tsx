"use client";

import { ArrowUpRight, Mail } from "lucide-react";
import { contrastText } from "@/lib/utils";
import { Editable } from "./editable";
import { ContactForm, TemplateProps, blockContent, hasBlock } from "./shared";

export function Editorial({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Your Name";
  const onBrand = contrastText(brandColor);
  const hero = blockContent(siteData, "hero");
  const cta = blockContent(siteData, "cta");
  const about = blockContent(siteData, "about");
  const services = blockContent(siteData, "services");
  const testi = blockContent(siteData, "testimonials");
  const contact = blockContent(siteData, "contact");

  return (
    <div className="bg-[#f7efe7] font-sans text-neutral-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <span className="font-serif text-xl font-medium">{name}</span>
        <nav className="hidden gap-7 text-sm text-neutral-600 md:flex">
          <a href="#about">About</a><a href="#work">Work</a><a href="#contact">Contact</a>
        </nav>
      </header>

      {/* Split hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-2">
        <div className="order-2 aspect-[4/5] rounded-2xl md:order-1" style={{ background: `${brandColor}33` }} />
        <div className="order-1 md:order-2">
          <p className="text-sm uppercase tracking-[0.3em]" style={{ color: brandColor }}>{hero.subheadline ? "Hello, I'm" : ""}</p>
          <Editable as="h1" blockId="hero" field="headline" value={hero.headline || name}
            className="mt-3 font-serif text-5xl font-medium leading-[1.05] sm:text-6xl" />
          <Editable as="p" blockId="hero" field="subheadline" value={hero.subheadline || ""}
            className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600" />
          <a href="#contact" className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: brandColor }}>
            {hero.ctaText || "Work with me"} <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Lead magnet band */}
      {hasBlock(siteData, "cta") && (
        <section className="px-5 py-12" style={{ background: brandColor, color: onBrand }}>
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <Editable as="h2" blockId="cta" field="headline" value={cta.headline || "Join my newsletter"} className="font-serif text-2xl" />
              <Editable as="p" blockId="cta" field="body" value={cta.body || ""} className="mt-1 opacity-90" />
            </div>
            <div className="flex w-full max-w-sm items-center gap-2 rounded-full bg-white p-1.5">
              <Mail className="ml-2 h-4 w-4 text-neutral-400" />
              <input className="flex-1 bg-transparent px-1 text-sm text-neutral-900 outline-none" placeholder="Email address" />
              <button className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: brandColor, color: onBrand }}>{cta.buttonText || "Subscribe"}</button>
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {hasBlock(siteData, "about") && (
        <section id="about" className="mx-auto max-w-3xl px-5 py-20 text-center">
          <Editable as="h2" blockId="about" field="title" value={about.title || "About"} className="font-serif text-3xl" />
          <Editable as="p" blockId="about" field="body" value={about.body || ""} multiline
            className="mt-5 text-lg leading-relaxed text-neutral-600" />
        </section>
      )}

      {/* Services */}
      {hasBlock(siteData, "services") && (
        <section id="work" className="border-y border-black/10">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <Editable as="h2" blockId="services" field="title" value={services.title || "How I help"} className="font-serif text-3xl" />
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {(services.items || []).map((s: any, i: number) => (
                <div key={i} className="border-t-2 pt-4" style={{ borderColor: brandColor }}>
                  <span className="font-serif text-2xl text-neutral-300">0{i + 1}</span>
                  <h3 className="mt-1 font-medium">{s.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {hasBlock(siteData, "testimonials") && (
        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          {(testi.items || []).slice(0, 1).map((t: any, i: number) => (
            <figure key={i}>
              <blockquote className="font-serif text-2xl leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-5 text-sm uppercase tracking-widest" style={{ color: brandColor }}>{t.name}</figcaption>
            </figure>
          ))}
        </section>
      )}

      {/* Contact */}
      {hasBlock(siteData, "contact") && (
        <section id="contact" className="border-t border-black/10">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <Editable as="h2" blockId="contact" field="title" value={contact.title || "Get in touch"} className="text-center font-serif text-3xl" />
            <div className="mt-8"><ContactForm accent={brandColor} buttonText={onBrand} /></div>
          </div>
        </section>
      )}

      <footer className="py-8 text-center text-sm text-neutral-500">{name} — Built with Tomora</footer>
    </div>
  );
}
