"use client";

import { useMemo, useRef, useState } from "react";
import {
  Clock, MapPin, Bike, ShoppingBag, Plus, Minus, Star, Tag, Search, X,
  UtensilsCrossed, Percent, Store, MessageCircle,
} from "lucide-react";
import type { CatalogProduct, Product } from "@/lib/database.types";
import {
  TemplateProps, Brandmark, SocialIcons, testimonialsOf, Img,
  heading, subheading, navItems, CustomSections, OrderedSections,
  sellingPrice, originalPrice, toProduct,
} from "./shared";
import { useTemplateEdit } from "../editor-context";
import { useStore } from "../store-context";
import { formatNaira } from "@/lib/utils";
import { openState } from "@/lib/restaurant/hours";
import { etaLabel } from "@/lib/restaurant/order";
import { combosOf, DAY_NAMES, DEFAULT_TIMEZONE, type Combo } from "@/lib/restaurant/types";
import { openSupport } from "@/lib/support-bus";

/**
 * Kitchen One: a restaurant menu storefront. Warm cream surface, one accent
 * colour taken from the owner's brand, rounded cards and a circular add button
 * per dish. On phones it behaves like a delivery app: a chip rail for
 * categories and a fixed bottom tab bar, with the cart reachable everywhere.
 *
 * Menu items are ordinary `products`, so the existing cart and checkout carry
 * them. Combos ride the same path as synthetic products with a `combo:<id>` id,
 * which the checkout API prices from the saved settings rather than the client.
 */
export function KitchenOne({ siteData, brandColor }: TemplateProps) {
  const { editing } = useTemplateEdit();
  const store = useStore();
  const accent = brandColor || "#E8590C";

  const name = siteData.businessName || "Kitchen One";
  const allProducts = useMemo(() => siteData.products || [], [siteData.products]);
  const r = siteData.restaurant || {};

  // A combo is not a menu item: products the owner allocated to Combos are
  // shown there and left out of the menu entirely.
  const comboIds = useMemo(() => new Set(siteData.comboProductIds || []), [siteData.comboProductIds]);
  const comboProducts = useMemo(
    () => allProducts.filter((p) => comboIds.has(p.id)),
    [allProducts, comboIds]
  );
  const products = useMemo(
    () => allProducts.filter((p) => !comboIds.has(p.id)),
    [allProducts, comboIds]
  );
  const combos: Combo[] = combosOf(siteData).filter((c) => c.available !== false);

  const state = openState(r.hours, r.timezone || DEFAULT_TIMEZONE);
  const canOrder = state.open || !r.closeOutsideHours;

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) {
      const c = (p.category || "").trim();
      if (c && !seen.includes(c)) seen.push(c);
    }
    return seen;
  }, [products]);

  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  /** The tab bar's Search jumps to the menu and opens the keyboard on it. The
   *  focus has to happen in the tap itself, or a phone will not raise it. */
  const focusSearch = () => {
    const el = searchRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (active !== "all" && (p.category || "").trim() !== active) return false;
      if (!q) return true;
      return `${p.name} ${p.description || ""}`.toLowerCase().includes(q);
    });
  }, [products, active, query]);

  /** Editor-typed combos are added to the cart as products the API can re-price. */
  const addCombo = (c: Combo, qty = 1) => {
    const synthetic = {
      id: `combo:${c.id}`,
      name: c.name,
      description: (c.items || []).join(", "),
      price: c.price,
      compare_price: c.comparePrice || null,
      images: c.image ? [c.image] : [],
      category: "Combos",
      stock: 999,
      is_active: true,
    } as unknown as Product;
    store.addToCart(synthetic, qty);
  };

  /**
   * The Combos section shows two things as one grid: products the owner
   * allocated to combos (ordinary products, so the cart and checkout price
   * them from the database) and any combos typed into the site editor.
   */
  const comboCards = useMemo(() => {
    const fromProducts = comboProducts.map((p) => ({
      key: p.id,
      name: p.name,
      description: p.description,
      image: p.image,
      price: sellingPrice(p),
      comparePrice: originalPrice(p) ?? p.comparePrice,
      inside: [] as string[],
      add: (qty: number) => store.addToCart(toProduct(p, siteData), qty),
    }));
    const fromSettings = combos.map((c) => ({
      key: c.id,
      name: c.name,
      description: c.description,
      image: c.image,
      price: c.price,
      comparePrice: c.comparePrice,
      // A line the owner has not filled in yet should not show as a gap.
      inside: (c.items || []).map((s) => s.trim()).filter(Boolean),
      add: (qty: number) => addCombo(c, qty),
    }));
    return [...fromProducts, ...fromSettings];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboProducts, combos, store]);

  const eta = etaLabel(r.prepTimeMins, r.deliveryTimeMins, "delivery");

  /* ------------------------------- sections ------------------------------ */
  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <section className="px-4 pt-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[26px] bg-[#2a1207] text-white">
            <Img
              src={siteData.heroImage || siteData.sectionImages?.hero}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
            <span className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
            <div className="relative px-6 py-10 sm:px-10 sm:py-16 lg:max-w-2xl lg:py-20">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                style={{ background: accent }}
              >
                {heading(siteData, "heroEyebrow", "Good food, good mood")}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
                {heading(siteData, "hero", `Fresh food,\ndelivered fast.`)
                  .split("\n")
                  .map((l, i) => (
                    <span key={i} className="block">{l}</span>
                  ))}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
                {subheading(
                  siteData,
                  "hero",
                  "Order your favourites in a few taps. Delivery to your door or pick up in person."
                )}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#menu"
                  className="rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg"
                  style={{ background: accent }}
                >
                  {heading(siteData, "heroBtn", "Order now")}
                </a>
                <a
                  href="#visit"
                  className="rounded-full bg-white/95 px-6 py-3 text-sm font-bold text-[#2a1207]"
                >
                  {heading(siteData, "heroBtn2", "Find us")}
                </a>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${state.open ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                  {state.open ? "Open now" : "Closed"}
                  {state.label ? ` · ${state.label}` : ""}
                </span>
                {eta && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {eta}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    ),

    info: (
      <section className="px-4 pt-5 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              icon: Bike,
              title: r.deliveryEnabled === false ? "Pickup only" : "Delivery",
              body:
                r.deliveryEnabled === false
                  ? "Collect your order in person"
                  : r.deliveryTimeMins
                    ? `About ${r.deliveryTimeMins} minutes`
                    : "To your door",
            },
            {
              icon: Clock,
              title: "Kitchen time",
              body: r.prepTimeMins ? `Ready in about ${r.prepTimeMins} minutes` : "Freshly made",
            },
            {
              icon: Store,
              title: r.pickupEnabled ? "Pickup available" : "Delivery only",
              body: r.pickupEnabled ? r.pickupAddress || "Collect in person" : "We bring it to you",
            },
            {
              icon: Tag,
              title: r.minOrder ? "Minimum order" : "No minimum",
              body: r.minOrder ? formatNaira(r.minOrder) : "Order any amount",
            },
          ].map((t) => (
            <div
              key={t.title}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_14px_rgba(42,18,7,0.07)]"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${accent}1a`, color: accent }}
              >
                <t.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold text-[#2a1207]">{t.title}</span>
                <span className="block truncate text-[11px] text-[#2a1207]/55">{t.body}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    ),

    combos: comboCards.length ? (
      <section id="combos" className="px-4 pt-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title={heading(siteData, "combos", "Popular combos")}
            text={subheading(siteData, "combos", "Full meals at one price. Feed yourself or the family.")}
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comboCards.map((c) => (
              <ComboCard key={c.key} combo={c} accent={accent} disabled={!canOrder} />
            ))}
          </div>
        </div>
      </section>
    ) : null,

    menu: (
      <section id="menu" className="px-4 pt-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title={heading(siteData, "menu", "Our menu")}
            text={subheading(siteData, "menu", "Everything is made to order. Pick what you fancy.")}
          />

          {/* Search + category rail. The rail scrolls sideways on a phone. */}
          <div className="mt-5 flex flex-col gap-3">
            <label className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-[0_2px_14px_rgba(42,18,7,0.07)]">
              <Search className="h-4 w-4 shrink-0 text-[#2a1207]/40" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the menu"
                aria-label="Search the menu"
                className="w-full bg-transparent text-sm text-[#2a1207] outline-none placeholder:text-[#2a1207]/40"
              />
              {query && (
                <button
                  type="button" onClick={() => setQuery("")} aria-label="Clear search"
                  className="shrink-0 text-[#2a1207]/40 hover:text-[#2a1207]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>

            {categories.length > 0 && (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]{display:none}">
                {[{ id: "all", label: "All items" }, ...categories.map((c) => ({ id: c, label: c }))].map(
                  (c) => (
                    <button
                      key={c.id}
                      onClick={() => setActive(c.id)}
                      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                        active === c.id
                          ? "text-white shadow"
                          : "bg-white text-[#2a1207]/65 hover:text-[#2a1207]"
                      }`}
                      style={active === c.id ? { background: accent } : undefined}
                    >
                      {c.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {shown.length === 0 ? (
            <p className="mt-10 rounded-2xl bg-white px-6 py-14 text-center text-sm text-[#2a1207]/50">
              Nothing on the menu matches that yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {shown.map((p) => (
                <DishCard
                  key={p.id}
                  product={p}
                  accent={accent}
                  disabled={!canOrder}
                  onAdd={(qty) => store.addToCart(toProduct(p, siteData), qty)}
                  onOpen={() => store.openProduct?.(toProduct(p, siteData))}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    ),

    offer: (
      <section className="px-4 pt-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[26px] px-6 py-10 sm:px-10" style={{ background: accent }}>
            <div className="relative max-w-xl text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                <Percent className="h-3 w-3" />
                {heading(siteData, "offerEyebrow", "Limited time")}
              </span>
              <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl">
                {heading(siteData, "sale", "Get your first order for less")}
              </h2>
              <p className="mt-3 text-sm text-white/85">
                {subheading(
                  siteData,
                  "sale",
                  "Use your discount code at checkout and enjoy the meal on us."
                )}
              </p>
              <a
                href="#menu"
                className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold"
                style={{ color: accent }}
              >
                {heading(siteData, "offerBtn", "Order now")}
              </a>
            </div>
          </div>
        </div>
      </section>
    ),

    visit: (
      <section id="visit" className="px-4 pt-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title={heading(siteData, "visit", "Find us")}
            text={subheading(siteData, "visit", "Come and eat with us, or let us bring it to you.")}
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-[0_2px_18px_rgba(42,18,7,0.08)]">
              <h3 className="flex items-center gap-2 font-bold text-[#2a1207]">
                <MapPin className="h-4 w-4" style={{ color: accent }} /> Pickup and address
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#2a1207]/65">
                {r.pickupAddress || siteData.address || "Add your address in the dashboard."}
              </p>
              {r.pickupNote && <p className="mt-2 text-xs text-[#2a1207]/50">{r.pickupNote}</p>}
              {siteData.phone && (
                <a
                  href={`tel:${siteData.phone}`}
                  className="mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-bold text-white"
                  style={{ background: accent }}
                >
                  Call {siteData.phone}
                </a>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-[0_2px_18px_rgba(42,18,7,0.08)]">
              <h3 className="flex items-center gap-2 font-bold text-[#2a1207]">
                <Clock className="h-4 w-4" style={{ color: accent }} /> Opening hours
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm">
                {(r.hours || []).map((h) => (
                  <li key={h.day} className="flex items-center justify-between gap-4">
                    <span className="text-[#2a1207]/65">{DAY_NAMES[h.day]}</span>
                    <span className="font-semibold text-[#2a1207]">
                      {h.closed ? "Closed" : `${h.open} to ${h.close}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    ),

    testimonials: testimonialsOf(siteData).length ? (
      <section className="px-4 pt-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title={heading(siteData, "testimonials", "What people say")}
            text={subheading(siteData, "testimonials", "")}
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonialsOf(siteData).map((t, i) => (
              <div key={i} className="rounded-3xl bg-white p-6 shadow-[0_2px_18px_rgba(42,18,7,0.08)]">
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-current" style={{ color: accent }} />
                  ))}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-[#2a1207]/70">{t.quote}</p>
                <p className="mt-4 text-sm font-bold text-[#2a1207]">{t.name}</p>
                {t.role && <p className="text-xs text-[#2a1207]/50">{t.role}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : null,
  };

  const natural = ["hero", "info", "combos", "menu", "offer", "visit", "testimonials"];

  return (
    <div className="min-h-screen bg-[#FDF7F0] pb-24 text-[#2a1207] lg:pb-0">
      {/* ------------------------------ header ------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-[#2a1207]/5 bg-[#FDF7F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <Brandmark siteData={siteData} name={name} />
          <nav className="hidden items-center gap-7 lg:flex">
            {navItems(siteData, [
              ["Menu", "#menu"],
              ["Combos", "#combos"],
              ["Find us", "#visit"],
            ]).map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm font-semibold text-[#2a1207]/65 transition hover:text-[#2a1207]"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex ${
                state.open ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${state.open ? "bg-emerald-500" : "bg-red-500"}`} />
              {state.open ? "Open" : "Closed"}
            </span>
            <button
              onClick={() => store.openCart?.()}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow"
              style={{ background: accent }}
              aria-label="Open cart"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {!canOrder && (
        <div className="px-4 pt-4 sm:px-6 lg:px-10">
          <p className="mx-auto max-w-6xl rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
            The kitchen is closed right now. {state.label}
          </p>
        </div>
      )}

      <OrderedSections siteData={siteData} natural={natural} blocks={blocks} />
      <CustomSections sections={siteData.customSections} />

      {/* ------------------------------ footer ------------------------------ */}
      <footer className="mt-14 bg-[#2a1207] px-4 py-12 text-white/80 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-extrabold text-white">{name}</p>
            <p className="mt-2 max-w-xs text-sm text-white/60">
              {subheading(siteData, "footer", siteData.tagline || "Good food, made fresh, brought to you.")}
            </p>
            <div className="mt-4">
              <SocialIcons social={siteData.social} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/50">Order</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#menu" className="hover:text-white">Menu</a></li>
              {combos.length > 0 && <li><a href="#combos" className="hover:text-white">Combos</a></li>}
              <li><a href="#visit" className="hover:text-white">Find us</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/50">Opening hours</p>
            <ul className="mt-3 space-y-1.5 text-sm text-white/70">
              {(r.hours || []).slice(0, 7).map((h) => (
                <li key={h.day} className="flex justify-between gap-3">
                  <span>{DAY_NAMES[h.day].slice(0, 3)}</span>
                  <span>{h.closed ? "Closed" : `${h.open}-${h.close}`}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/50">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {siteData.phone && <li>{siteData.phone}</li>}
              {siteData.email && <li className="break-all">{siteData.email}</li>}
              {(r.pickupAddress || siteData.address) && <li>{r.pickupAddress || siteData.address}</li>}
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} {name}. {siteData.footerCredit || "Built with Tomora."}
        </p>
      </footer>

      {/* --------------------- mobile app style tab bar --------------------- */}
      {!editing && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2a1207]/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          {/* Five equal columns: every tab gets the same width whatever its
              label, so nothing squeezes an icon out of shape on a small phone. */}
          <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 py-2">
            <TabLink href="#menu" icon={UtensilsCrossed} label="Menu" />
            <TabLink onClick={focusSearch} icon={Search} label="Search" />
            <div className="flex justify-center">
              <button
                onClick={() => store.openCart?.()}
                className="-mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95"
                style={{ background: accent }}
                aria-label="Open cart"
              >
                <ShoppingBag className="h-5 w-5 shrink-0" />
              </button>
            </div>
            {comboCards.length > 0
              ? <TabLink href="#combos" icon={Tag} label="Combos" />
              : <TabLink href="#visit" icon={MapPin} label="Find us" />}
            {/* Support belongs in the bar: as a floating bubble it sat on top
                of a tab. The site hides that bubble on phones for this template. */}
            {store.live
              ? <TabLink onClick={openSupport} icon={MessageCircle} label="Support" />
              : <TabLink href="#visit" icon={MapPin} label="Find us" />}
          </div>
        </nav>
      )}
    </div>
  );
}

/* ------------------------------- pieces -------------------------------- */

function SectionHead({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#2a1207] sm:text-3xl">{title}</h2>
        {text && <p className="mt-1.5 max-w-xl text-sm text-[#2a1207]/55">{text}</p>}
      </div>
    </div>
  );
}

interface ComboCardData {
  key: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  comparePrice?: number;
  inside: string[];
  add: (qty: number) => void;
}

function ComboCard({
  combo: c, accent, disabled,
}: {
  combo: ComboCardData;
  accent: string;
  disabled?: boolean;
}) {
  const [qty, step] = useQty();
  const saving =
    c.comparePrice && c.comparePrice > c.price
      ? Math.round(((c.comparePrice - c.price) / c.comparePrice) * 100)
      : 0;
  return (
    <div className="group overflow-hidden rounded-3xl bg-white shadow-[0_2px_18px_rgba(42,18,7,0.08)]">
      <div className="relative aspect-[16/11] overflow-hidden bg-[#f6ece1]">
        <Img src={c.image} alt={c.name} className="h-full w-full object-cover" />
        {saving > 0 && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
            style={{ background: accent }}
          >
            SAVE {saving}%
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[#2a1207]">{c.name}</h3>
        {c.inside.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-[#2a1207]/55">{c.inside.join(" + ")}</p>
        )}
        {c.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-[#2a1207]/55">{c.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-lg font-extrabold text-[#2a1207]">
              {formatNaira(c.price)}
            </span>
            {saving > 0 && (
              <span className="block text-xs text-[#2a1207]/40 line-through">
                {formatNaira(c.comparePrice!)}
              </span>
            )}
          </span>
          <QtyStepper qty={qty} step={step} disabled={disabled} />
        </div>
        <OrderButton accent={accent} disabled={disabled} qty={qty} total={c.price * qty} onClick={() => c.add(qty)} />
      </div>
    </div>
  );
}

/**
 * Quantity for one card. Steps by a delta through the updater form, so two taps
 * in quick succession count twice rather than both reading the same start value.
 */
function useQty(): [number, (delta: number) => void] {
  const [qty, setQty] = useState(1);
  const step = (delta: number) => setQty((q) => Math.max(1, Math.min(99, q + delta)));
  return [qty, step];
}

/**
 * Choose how many before ordering. A customer buying three of the same dish
 * should not have to add it, open the cart and count up in there.
 */
function QtyStepper({
  qty, step, disabled,
}: {
  qty: number;
  /** Takes a delta, not a value: two quick taps must count as two. */
  step: (delta: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#f6ece1] p-1">
      <button
        type="button" onClick={() => step(-1)} disabled={disabled || qty <= 1} aria-label="Reduce quantity"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2a1207] shadow-sm transition active:scale-95 disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums text-[#2a1207]" aria-live="polite">
        {qty}
      </span>
      <button
        type="button" onClick={() => step(1)} disabled={disabled || qty >= 99} aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2a1207] shadow-sm transition active:scale-95 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function DishCard({
  product, accent, onAdd, onOpen, disabled,
}: {
  /** The template's own content shape, which is what the menu grid passes. */
  product: CatalogProduct;
  accent: string;
  onAdd: (qty: number) => void;
  onOpen: () => void;
  disabled?: boolean;
}) {
  const [qty, step] = useQty();
  const price = sellingPrice(product);
  const was = originalPrice(product) ?? product.comparePrice;
  const off = was && was > price ? Math.round(((was - price) / was) * 100) : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_2px_18px_rgba(42,18,7,0.08)]">
      <button onClick={onOpen} className="relative aspect-square overflow-hidden bg-[#f6ece1] text-left">
        <Img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {product.bestSeller && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">
            BESTSELLER
          </span>
        )}
        {off > 0 && (
          <span
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
            style={{ background: accent }}
          >
            {off}% OFF
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-4">
        <button onClick={onOpen} className="text-left">
          <h3 className="line-clamp-1 font-bold text-[#2a1207]">{product.name}</h3>
        </button>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#2a1207]/55">
            {product.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="min-w-0">
            <span className="block truncate text-lg font-extrabold text-[#2a1207]">
              {formatNaira(price)}
            </span>
            {off > 0 && was && (
              <span className="block text-xs text-[#2a1207]/40 line-through">
                {formatNaira(was)}
              </span>
            )}
          </span>
          <QtyStepper qty={qty} step={step} disabled={disabled} />
        </div>
        <OrderButton accent={accent} disabled={disabled} qty={qty} total={price * qty} onClick={() => onAdd(qty)} />
      </div>
    </div>
  );
}

/** Adds the chosen quantity, and says what that will cost before it is tapped. */
function OrderButton({
  accent, onClick, disabled, qty, total,
}: {
  accent: string;
  onClick: () => void;
  disabled?: boolean;
  qty: number;
  total: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white shadow transition active:scale-[0.98] disabled:opacity-40"
      style={{ background: accent }}
    >
      <Plus className="h-4 w-4 shrink-0" />
      {disabled ? "Closed" : qty > 1 ? `Add ${qty} · ${formatNaira(total)}` : "Add to order"}
    </button>
  );
}

/**
 * One slot of the bottom bar. It fills its grid column rather than claiming a
 * fixed width, and the icon is held at its size, so a longer label can never
 * shrink or stretch an icon against its neighbours.
 */
function TabLink({
  href, onClick, icon: Icon, label,
}: {
  href?: string;
  onClick?: () => void;
  icon: typeof MapPin;
  label: string;
}) {
  const className =
    "flex w-full flex-col items-center justify-end gap-1 px-1 py-1 text-[#2a1207]/55 transition active:text-[#2a1207]";
  const inner = (
    <>
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
      <span className="w-full truncate text-center text-[10px] font-semibold leading-none">{label}</span>
    </>
  );
  if (onClick) {
    return <button type="button" onClick={onClick} className={className}>{inner}</button>;
  }
  return <a href={href} className={className}>{inner}</a>;
}
