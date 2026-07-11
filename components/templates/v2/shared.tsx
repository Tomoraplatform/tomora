"use client";

import { useState } from "react";
import { Star, ShoppingCart, Zap, Instagram, Twitter, Facebook, Globe, CheckCircle2, Linkedin, Github, Phone, Mail, MapPin, CalendarClock } from "lucide-react";
import type { SiteData, CatalogProduct, CatalogTestimonial, Product, SocialLinks, CustomSection } from "@/lib/database.types";
import { formatNaira, parseNaira, cn } from "@/lib/utils";
import { useStore } from "../store-context";
import { useTemplateEdit } from "../editor-context";

type LeadSource = "contact" | "newsletter" | "register";

/** Posts a lead to the site owner. Returns true on success (or in preview). */
async function submitLead(
  siteId: string | undefined,
  payload: { source: LeadSource; name?: string; email?: string; phone?: string; message?: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!siteId) return { ok: true }; // preview / editor: pretend success, don't store
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, ...payload }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error || "Could not submit. Please try again." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export interface TemplateProps {
  siteData: SiteData;
  brandColor: string;
}

/** Renders the uploaded logo if present, otherwise the business name text. */
export function Brandmark({
  siteData,
  name,
  className,
}: {
  siteData: SiteData;
  name: string;
  className?: string;
}) {
  if (siteData.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={siteData.logoUrl} alt={name} className="h-9 w-auto max-w-[170px] object-contain" />;
  }
  return <span className={className}>{name}</span>;
}

/** Brand-colored solid button. */
export function BrandButton({
  children, className = "", as = "button", href, onClick,
}: {
  children: React.ReactNode; className?: string;
  as?: "button" | "a"; href?: string; onClick?: () => void;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${className}`;
  const style = { background: "var(--brand-primary)", color: "var(--brand-on-primary)" } as React.CSSProperties;
  if (as === "a") return <a href={href} className={cls} style={style} onClick={onClick}>{children}</a>;
  return <button className={cls} style={style} onClick={onClick}>{children}</button>;
}

export function OutlineButton({ children, className = "", href }: { children: React.ReactNode; className?: string; href?: string }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm font-semibold ${className}`;
  return <a href={href || "#"} className={cls}>{children}</a>;
}

export function StarRow({ rating = 5, count }: { rating?: number; count?: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="flex" style={{ color: "var(--brand-primary)" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-4 w-4" fill={i < Math.round(rating) ? "currentColor" : "none"} />
        ))}
      </span>
      {count != null && <span className="text-black/40">({count})</span>}
    </div>
  );
}

export function Img({ src, alt = "", className = "" }: { src?: string; alt?: string; className?: string }) {
  if (!src) return <div className={`bg-black/10 ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={className} />;
}

/** The price the customer actually pays — applies an active offer discount. */
export function sellingPrice(p: CatalogProduct): number {
  if (p.offer && p.offerPercent && p.offerPercent > 0) {
    return Math.round(p.price * (1 - p.offerPercent / 100));
  }
  return p.price;
}
/** The crossed-out original price, if the product is discounted. */
export function originalPrice(p: CatalogProduct): number | undefined {
  if (p.offer && p.offerPercent && p.offerPercent > 0) return p.price;
  return p.comparePrice;
}

/** Maps a catalog product into the cart Product shape and fires store actions. */
function toProduct(p: CatalogProduct, siteData: SiteData): Product {
  return {
    id: p.id, user_id: "", site_id: "", name: p.name, description: p.description ?? null,
    price: sellingPrice(p), images: p.image ? [p.image] : [], category: p.category || null,
    stock: 99, is_active: true, colors: p.colors || [], color_variants: p.colorVariants || [], created_at: "",
  } as Product;
}

export function ProductCardV2({
  product, siteData, showButton = true,
}: {
  product: CatalogProduct; siteData: SiteData; showButton?: boolean;
}) {
  const store = useStore();
  const open = () => store.openProduct?.(toProduct(product, siteData));
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white">
      <button type="button" onClick={open} className="relative block aspect-square overflow-hidden bg-black/5 text-left">
        <Img src={product.image} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {product.offer && product.offerPercent ? (
          <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: "var(--brand-primary)" }}>-{product.offerPercent}%</span>
        ) : null}
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 onClick={open} className="line-clamp-1 cursor-pointer font-medium text-black/90">{product.name}</h3>
        {product.rating != null && <StarRow rating={product.rating} count={product.reviews} />}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black/90">{formatNaira(sellingPrice(product))}</span>
          {originalPrice(product) && <span className="text-sm text-black/40 line-through">{formatNaira(originalPrice(product)!)}</span>}
        </div>
        {showButton && (
          <button
            onClick={() => store.addToCart(toProduct(product, siteData))}
            className="mt-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold"
            style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}
          >
            <ShoppingCart className="h-4 w-4" /> Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductCardSplit({ product, siteData }: { product: CatalogProduct; siteData: SiteData }) {
  const store = useStore();
  const open = () => store.openProduct?.(toProduct(product, siteData));
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white p-3">
      <button type="button" onClick={open} className="block aspect-square w-full overflow-hidden rounded-md bg-black/5">
        <Img src={product.image} className="h-full w-full object-cover" />
      </button>
      <h3 onClick={open} className="mt-3 line-clamp-1 cursor-pointer text-sm text-black/80">{product.name}</h3>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-semibold">{formatNaira(product.price)}</span>
        <button onClick={() => store.addToCart(toProduct(product, siteData))} className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>
          Add to cart
        </button>
      </div>
    </div>
  );
}

export function ContactFormV2({
  submitText = "Send Message",
  phone = true,
  message = true,
  source = "contact",
  options,
  optionLabel = "Select an option",
}: {
  submitText?: string;
  phone?: boolean;
  message?: boolean;
  source?: LeadSource;
  /** Optional dropdown (e.g. choose an event). Its value is added to the message. */
  options?: string[];
  optionLabel?: string;
}) {
  const { siteId } = useStore();
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const choice = (fd.get("choice") as string) || "";
    const msg = (fd.get("message") as string) || "";
    setStatus("sending");
    setError("");
    const res = await submitLead(siteId, {
      source,
      name: (fd.get("name") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      message: [choice && `${optionLabel}: ${choice}`, msg].filter(Boolean).join(" — ") || undefined,
    });
    if (res.ok) setStatus("done");
    else { setError(res.error || "Something went wrong."); setStatus("error"); }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md bg-black/[0.03] px-4 py-8 text-center">
        <CheckCircle2 className="h-8 w-8" style={{ color: "var(--brand-primary)" }} />
        <p className="font-semibold">Thank you! Your message has been sent.</p>
        <p className="text-sm text-black/50">We&apos;ll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required className="rounded-md border border-black/15 bg-white px-4 py-3 text-sm" placeholder="Your name" />
        <input name="email" type="email" className="rounded-md border border-black/15 bg-white px-4 py-3 text-sm" placeholder="Your email" />
      </div>
      {phone && <input name="phone" className="rounded-md border border-black/15 bg-white px-4 py-3 text-sm" placeholder="Phone (optional)" />}
      {options && options.length > 0 && (
        <select name="choice" className="rounded-md border border-black/15 bg-white px-4 py-3 text-sm">
          <option value="">{optionLabel}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {message && <textarea name="message" rows={4} className="rounded-md border border-black/15 bg-white px-4 py-3 text-sm" placeholder="Your message" />}
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}
      >
        {status === "sending" ? "Sending…" : submitText}
      </button>
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

export function NewsletterInput({ buttonText = "Subscribe", dark = false }: { buttonText?: string; dark?: boolean }) {
  const { siteId } = useStore();
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = (fd.get("email") as string) || "";
    if (!email.trim()) return;
    setStatus("sending");
    const res = await submitLead(siteId, { source: "newsletter", email });
    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return <p className={`text-sm font-medium ${dark ? "text-white" : "text-black/70"}`}>Thanks for subscribing!</p>;
  }

  return (
    <form className="flex w-full max-w-md gap-2" onSubmit={onSubmit}>
      <input
        name="email"
        type="email"
        required
        className={`flex-1 rounded-md px-4 py-3 text-sm outline-none ${dark ? "border border-white/20 bg-white/10 text-white placeholder:text-white/50" : "border border-black/15 bg-white"}`}
        placeholder="Enter your email"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}
      >
        {status === "sending" ? "…" : buttonText}
      </button>
    </form>
  );
}

export { formatNaira, Zap };

/** Google Maps embed URL for an address (no API key needed), or null. */
export function mapEmbedUrl(address?: string): string | null {
  const a = (address || "").trim();
  if (!a) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(a)}&z=14&output=embed`;
}

/**
 * A showcase contact / enquiry block: phone, email, socials, an optional
 * "Book a time" link, a lead-capturing enquiry form and a map. Shared by the
 * Artisan templates (no purchase — the goal is to book, contact or enquire).
 */
export function ContactBlock({
  siteData, id = "contact", title, subtitle, tone = "light", submitText = "Send enquiry",
}: {
  siteData: SiteData; id?: string; title: string; subtitle?: string;
  tone?: "light" | "dark"; submitText?: string;
}) {
  const dark = tone === "dark";
  const booking = (siteData.bookingUrl || "").trim();
  const map = mapEmbedUrl(siteData.address);
  const muted = dark ? "text-white/70" : "text-black/60";
  const rowCls = dark ? "text-white/85" : "text-black/70";
  return (
    <section id={id} className="px-5 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className={`text-3xl font-bold ${dark ? "text-white" : ""}`}>{title}</h2>
        {subtitle ? <p className={`mt-2 max-w-xl ${muted}`}>{subtitle}</p> : null}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="space-y-3 text-sm">
              {siteData.phone ? <a href={`tel:${siteData.phone}`} className={`flex items-center gap-3 ${rowCls}`}><Phone className="h-4 w-4" style={{ color: "var(--brand-primary)" }} /> {siteData.phone}</a> : null}
              {siteData.email ? <a href={`mailto:${siteData.email}`} className={`flex items-center gap-3 ${rowCls}`}><Mail className="h-4 w-4" style={{ color: "var(--brand-primary)" }} /> {siteData.email}</a> : null}
              {siteData.address ? <p className={`flex items-center gap-3 ${rowCls}`}><MapPin className="h-4 w-4" style={{ color: "var(--brand-primary)" }} /> {siteData.address}</p> : null}
            </div>
            <SocialIcons social={siteData.social} circle className={`mt-4 ${dark ? "text-white/80" : "text-black/60"}`} />
            {booking ? (
              <a href={booking} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold" style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}>
                <CalendarClock className="h-4 w-4" /> Book a time
              </a>
            ) : null}
            <div className="mt-6"><ContactFormV2 submitText={submitText} /></div>
          </div>
          <div>
            {map ? (
              <iframe src={map} title="Map" loading="lazy" className="h-72 w-full rounded-2xl border-0 lg:h-full" />
            ) : (
              <div className={`flex h-72 w-full items-center justify-center rounded-2xl ${dark ? "bg-white/10 text-white/50" : "bg-black/5 text-black/40"} lg:h-full`}>
                <MapPin className="h-8 w-8" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Converts a YouTube/Vimeo watch URL into an embeddable player URL, or null. */
export function toEmbedUrl(raw?: string): string | null {
  const url = (raw || "").trim();
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/**
 * Responsive grid of creator videos added by link — 2 per row on mobile, 3 on
 * desktop, capped at 6. Embeds recognised YouTube/Vimeo links; otherwise shows
 * a "Watch video" card. Renders placeholder tiles until links are added.
 */
export function VideoLinkGrid({ videos, accentText = false }: { videos?: { id: string; title?: string; url?: string }[]; accentText?: boolean }) {
  const items = (videos || []).filter((v) => (v.url || "").trim()).slice(0, 6);
  if (items.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="aspect-video rounded-xl bg-black/10" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {items.map((v) => {
        const embed = toEmbedUrl(v.url);
        return (
          <figure key={v.id} className="overflow-hidden rounded-xl bg-black/5">
            {embed ? (
              <div className="aspect-video">
                <iframe src={embed} title={v.title || "Video"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
              </div>
            ) : (
              <a href={v.url} target="_blank" rel="noreferrer" className="flex aspect-video items-center justify-center bg-black/80 text-sm font-semibold text-white">
                Watch video
              </a>
            )}
            {v.title ? <figcaption className={`px-3 py-2 text-sm ${accentText ? "text-white/70" : "text-black/60"}`}>{v.title}</figcaption> : null}
          </figure>
        );
      })}
    </div>
  );
}

/**
 * Distinct product categories derived from the store's products (the owner
 * sets a product's Category when uploading it). Each entry carries a
 * representative image (the first product's image in that category).
 */
export function productCategories(products: CatalogProduct[]): { name: string; image: string }[] {
  const map = new Map<string, string>();
  for (const p of products) {
    const c = (p.category || "").trim();
    if (!c) continue;
    if (!map.get(c)) map.set(c, p.image || "");
  }
  return Array.from(map, ([name, image]) => ({ name, image }));
}

/** Editable testimonials, with a fallback so an un-edited site still looks full. */
export function testimonialsOf(siteData: SiteData): CatalogTestimonial[] {
  return siteData.testimonials?.length ? siteData.testimonials : [];
}

/** Editable nav-bar links. Returns [label, target] pairs (user's or template default). */
export function navItems(siteData: SiteData, fallback: [string, string][]): [string, string][] {
  if (siteData.navLinks?.length) return siteData.navLinks.map((n) => [n.label, n.target || "#"]);
  return fallback;
}

/** Editable header call-to-action button (text + link). `fallbackHref` is used until the owner sets a custom URL. */
export function headerCta(siteData: SiteData, defaultText: string, fallbackHref = "#"): { text: string; href: string; external: boolean } {
  const b = siteData.sectionButtons?.header || {};
  const href = (b.url || "").trim();
  return { text: b.text || defaultText, href: href || fallbackHref, external: /^https?:\/\//.test(href) };
}

/** Editable section heading. Returns the user's override or the template default. */
export function heading(siteData: SiteData, key: string, fallback: string): string {
  const v = siteData.sectionTitles?.[key];
  return v && v.trim() ? v : fallback;
}

/** Editable section intro text. Returns the user's override or the template default. */
export function subheading(siteData: SiteData, key: string, fallback: string): string {
  const v = siteData.sectionText?.[key];
  return v && v.trim() ? v : fallback;
}

/**
 * Returns the template's section keys in the user's saved order, with any
 * sections not present in the saved order appended in their natural order.
 */
export function orderedSectionKeys(order: string[] | undefined, natural: string[]): string[] {
  if (!order?.length) return natural;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const k of order) if (natural.includes(k) && !seen.has(k)) { result.push(k); seen.add(k); }
  for (const k of natural) if (!seen.has(k)) result.push(k);
  return result;
}

/** Renders a template's built-in sections in the user-defined order. */
export function OrderedSections({
  siteData, natural, blocks,
}: {
  siteData: SiteData;
  natural: string[];
  blocks: Record<string, React.ReactNode>;
}) {
  const { editing, onFocusSection } = useTemplateEdit();
  const hidden = new Set(siteData.hiddenSections || []);
  return (
    <>
      {orderedSectionKeys(siteData.sectionOrder, natural).map((k) => {
        if (!blocks[k] || hidden.has(k)) return null;
        // In the editor, clicking a section jumps the side panel to its controls.
        if (editing && onFocusSection) {
          return (
            <div
              key={k}
              data-edit-key={k}
              onClickCapture={() => onFocusSection(k)}
              className="relative cursor-pointer outline-offset-[-2px] transition hover:outline hover:outline-2 hover:outline-dashed hover:outline-sky-400/70"
            >
              {blocks[k]}
            </div>
          );
        }
        return <div key={k} className="contents">{blocks[k]}</div>;
      })}
    </>
  );
}

/** Editable services/features. Falls back to the template's built-in defaults. */
export function servicesOf(
  siteData: SiteData,
  fallback: { title: string; description?: string }[]
): { title: string; description?: string }[] {
  return siteData.services?.length ? siteData.services : fallback;
}

function normalizeUrl(url: string, base: string): string {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url;
  if (base) return base + url.replace(/^@/, "");
  return `https://${url}`;
}

/** Renders social icons for whichever links the user provided (editable). */
export function SocialIcons({ social, className = "", circle = false }: { social?: SocialLinks; className?: string; circle?: boolean }) {
  const items = [
    { url: social?.instagram, Icon: Instagram, base: "https://instagram.com/" },
    { url: social?.twitter, Icon: Twitter, base: "https://twitter.com/" },
    { url: social?.facebook, Icon: Facebook, base: "https://facebook.com/" },
    { url: social?.linkedin, Icon: Linkedin, base: "https://linkedin.com/in/" },
    { url: social?.github, Icon: Github, base: "https://github.com/" },
    { url: social?.website, Icon: Globe, base: "" },
  ].filter((i) => i.url);
  if (!items.length) return null;
  return (
    <div className={cn("flex gap-3", className)}>
      {items.map(({ url, Icon, base }, i) => (
        <a key={i} href={normalizeUrl(url as string, base)} target="_blank" rel="noreferrer"
          className={cn("transition-opacity hover:opacity-100",
            circle ? "flex h-9 w-9 items-center justify-center rounded-full border border-black/10 opacity-100" : "opacity-70")}>
          <Icon className={circle ? "h-4 w-4" : "h-5 w-5"} />
        </a>
      ))}
    </div>
  );
}

/* ===================== User-added custom sections ===================== */
function SectionButton({ text, href }: { text?: string; href?: string }) {
  if (!text) return null;
  return (
    <a
      href={href || "#"}
      className="mt-5 inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold"
      style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}
    >
      {text}
    </a>
  );
}

/** Renders a single user-built section. Uses brand CSS vars from the template. */
function CustomSectionBlock({ s }: { s: CustomSection }) {
  const align = s.align === "center" ? "text-center items-center" : "text-left items-start";
  const store = useStore();

  switch (s.type) {
    case "text":
      return (
        <section className="mx-auto max-w-3xl px-5 py-14">
          <div className={cn("flex flex-col", align)}>
            {s.headline && <h2 className="text-3xl font-bold">{s.headline}</h2>}
            {s.body && <p className="mt-4 whitespace-pre-line text-black/60">{s.body}</p>}
            <div className={s.align === "center" ? "mx-auto" : ""}><SectionButton text={s.buttonText} href={s.buttonHref} /></div>
          </div>
        </section>
      );

    case "image_text":
      return (
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2">
          <div className={s.imageSide === "right" ? "lg:order-2" : ""}>
            <Img src={s.image} className="aspect-[4/3] w-full rounded-2xl object-cover" />
          </div>
          <div className={s.imageSide === "right" ? "lg:order-1" : ""}>
            {s.headline && <h2 className="text-3xl font-bold">{s.headline}</h2>}
            {s.body && <p className="mt-4 whitespace-pre-line text-black/60">{s.body}</p>}
            <SectionButton text={s.buttonText} href={s.buttonHref} />
          </div>
        </section>
      );

    case "image_overlay":
      return (
        <section className="relative">
          <Img src={s.image} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative mx-auto max-w-3xl px-5 py-28 text-center text-white">
            {s.headline && <h2 className="text-3xl font-bold sm:text-4xl">{s.headline}</h2>}
            {s.body && <p className="mt-4 whitespace-pre-line text-white/80">{s.body}</p>}
            <SectionButton text={s.buttonText} href={s.buttonHref} />
          </div>
        </section>
      );

    case "cards":
      return (
        <section className="mx-auto max-w-6xl px-5 py-14">
          {s.headline && <h2 className="text-center text-3xl font-bold">{s.headline}</h2>}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(s.cards || []).map((c) => (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                {c.image && <Img src={c.image} className="aspect-[4/3] w-full object-cover" />}
                <div className="p-5">
                  <h3 className="font-semibold">{c.title}</h3>
                  {c.body && <p className="mt-1 text-sm text-black/60">{c.body}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case "products":
      return (
        <section className="mx-auto max-w-6xl px-5 py-14">
          {s.headline && <h2 className="text-center text-3xl font-bold">{s.headline}</h2>}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(s.products || []).map((p) => {
              const amount = parseNaira(p.price);
              // On a live store with a cart, these are purchasable.
              const cartProduct: Product = {
                id: `custom:${s.id}:${p.id}`, user_id: "", site_id: "", name: p.name,
                description: null, price: amount, images: p.image ? [p.image] : [],
                category: null, stock: 99, is_active: true, created_at: "",
              } as Product;
              return (
                <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white">
                  {p.image && <Img src={p.image} className="aspect-square w-full object-cover" />}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold">{p.name}</h3>
                    {p.price && <p className="mt-1 font-bold" style={{ color: "var(--brand-primary)" }}>{p.price}</p>}
                    <div className="mt-3">
                      {store.live && amount > 0 ? (
                        <button
                          onClick={() => store.addToCart(cartProduct)}
                          className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
                          style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}
                        >
                          <ShoppingCart className="h-4 w-4" /> Add to Cart
                        </button>
                      ) : p.buttonText ? (
                        <a href={p.buttonHref || "#"} className="block rounded-md px-4 py-2 text-center text-sm font-semibold"
                          style={{ background: "var(--brand-primary)", color: "var(--brand-on-primary)" }}>{p.buttonText}</a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );

    case "button":
      return (
        <section className="mx-auto max-w-3xl px-5 py-12 text-center">
          <SectionButton text={s.buttonText || "Click here"} href={s.buttonHref} />
        </section>
      );

    case "video":
      return (
        <section className="mx-auto max-w-4xl px-5 py-14">
          {s.headline && <h2 className="mb-6 text-center text-3xl font-bold">{s.headline}</h2>}
          {s.videoUrl && (
            <video src={s.videoUrl} controls className="w-full rounded-2xl bg-black" />
          )}
        </section>
      );

    case "video_text":
      return (
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2">
          <div className={s.imageSide === "right" ? "lg:order-2" : ""}>
            {s.videoUrl && <video src={s.videoUrl} controls className="w-full rounded-2xl bg-black" />}
          </div>
          <div className={s.imageSide === "right" ? "lg:order-1" : ""}>
            {s.headline && <h2 className="text-3xl font-bold">{s.headline}</h2>}
            {s.body && <p className="mt-4 whitespace-pre-line text-black/60">{s.body}</p>}
            <SectionButton text={s.buttonText} href={s.buttonHref} />
          </div>
        </section>
      );

    case "video_bg":
      return (
        <section className="relative overflow-hidden">
          {s.videoUrl && (
            <video src={s.videoUrl} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative mx-auto max-w-3xl px-5 py-28 text-center text-white">
            {s.headline && <h2 className="text-3xl font-bold sm:text-4xl">{s.headline}</h2>}
            {s.body && <p className="mt-4 whitespace-pre-line text-white/80">{s.body}</p>}
            <SectionButton text={s.buttonText} href={s.buttonHref} />
          </div>
        </section>
      );

    default:
      return null;
  }
}

/**
 * Renders user-added custom sections for a given placement zone:
 *  - "top"    → just below the hero
 *  - "bottom" → above the footer (default)
 */
export function CustomSections({ sections, at = "bottom" }: { sections?: CustomSection[]; at?: "top" | "bottom" }) {
  if (!sections?.length) return null;
  const zone = sections.filter((s) => (s.placement || "bottom") === at);
  if (!zone.length) return null;
  return <>{zone.map((s) => <CustomSectionBlock key={s.id} s={s} />)}</>;
}
