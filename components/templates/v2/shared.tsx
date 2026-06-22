"use client";

import { useState } from "react";
import { Star, ShoppingCart, Zap, Instagram, Twitter, Facebook, Globe, CheckCircle2 } from "lucide-react";
import type { SiteData, CatalogProduct, CatalogTestimonial, Product, SocialLinks, CustomSection } from "@/lib/database.types";
import { formatNaira, parseNaira, cn } from "@/lib/utils";
import { useStore } from "../store-context";

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

/** Maps a catalog product into the cart Product shape and fires store actions. */
function toProduct(p: CatalogProduct, siteData: SiteData): Product {
  return {
    id: p.id, user_id: "", site_id: "", name: p.name, description: null,
    price: p.price, images: p.image ? [p.image] : [], category: p.category || null,
    stock: 99, is_active: true, created_at: "",
  } as Product;
}

export function ProductCardV2({
  product, siteData, showButton = true,
}: {
  product: CatalogProduct; siteData: SiteData; showButton?: boolean;
}) {
  const store = useStore();
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className="aspect-square overflow-hidden bg-black/5">
        <Img src={product.image} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-medium text-black/90">{product.name}</h3>
        {product.rating != null && <StarRow rating={product.rating} count={product.reviews} />}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black/90">{formatNaira(product.price)}</span>
          {product.comparePrice && <span className="text-sm text-black/40 line-through">{formatNaira(product.comparePrice)}</span>}
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
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white p-3">
      <div className="aspect-square overflow-hidden rounded-md bg-black/5">
        <Img src={product.image} className="h-full w-full object-cover" />
      </div>
      <h3 className="mt-3 line-clamp-1 text-sm text-black/80">{product.name}</h3>
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

/** Editable testimonials, with a fallback so an un-edited site still looks full. */
export function testimonialsOf(siteData: SiteData): CatalogTestimonial[] {
  return siteData.testimonials?.length ? siteData.testimonials : [];
}

/** Editable section heading. Returns the user's override or the template default. */
export function heading(siteData: SiteData, key: string, fallback: string): string {
  const v = siteData.sectionTitles?.[key];
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
  return (
    <>
      {orderedSectionKeys(siteData.sectionOrder, natural).map((k) =>
        blocks[k] ? <div key={k} className="contents">{blocks[k]}</div> : null
      )}
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
export function SocialIcons({ social, className = "" }: { social?: SocialLinks; className?: string }) {
  const items = [
    { url: social?.instagram, Icon: Instagram, base: "https://instagram.com/" },
    { url: social?.twitter, Icon: Twitter, base: "https://twitter.com/" },
    { url: social?.facebook, Icon: Facebook, base: "https://facebook.com/" },
    { url: social?.website, Icon: Globe, base: "" },
  ].filter((i) => i.url);
  if (!items.length) return null;
  return (
    <div className={cn("flex gap-3", className)}>
      {items.map(({ url, Icon, base }, i) => (
        <a key={i} href={normalizeUrl(url as string, base)} target="_blank" rel="noreferrer" className="opacity-70 transition-opacity hover:opacity-100">
          <Icon className="h-5 w-5" />
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
