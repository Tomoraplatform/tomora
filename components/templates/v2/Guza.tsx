"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingBag, Heart, LayoutGrid, Grid3x3 } from "lucide-react";
import { BrandStyle } from "../brand-style";
import {
  TemplateProps, Brandmark, Img, formatNaira, sellingPrice, originalPrice,
  heading, navItems, productCategories, CustomSections, OrderedSections,
} from "./shared";
import { DonationSection } from "./DonationSection";
import { useStore } from "../store-context";
import type { CatalogProduct, Product, SiteData } from "@/lib/database.types";

const slug = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const COLOR_HEX: Record<string, string> = {
  blue: "#1d4ed8", navy: "#1e3a8a", grey: "#9ca3af", gray: "#9ca3af", silver: "#cbd5e1",
  red: "#dc2626", maroon: "#7f1d1d", yellow: "#eab308", gold: "#d4a017", black: "#111827",
  white: "#f3f4f6", tan: "#c9a27a", beige: "#d8c3a5", cream: "#efe9dd", brown: "#8b5e3c",
  green: "#16a34a", olive: "#5c6b3a", pink: "#ec4899", orange: "#ea580c", purple: "#7c3aed",
};
function colorHex(name: string) {
  return COLOR_HEX[(name || "").trim().toLowerCase()] || "#cbd5e1";
}

function GuzaCard({ product, siteData }: { product: CatalogProduct; siteData: SiteData }) {
  const store = useStore();
  const asProduct = {
    id: product.id, name: product.name, description: (product as any).description || null,
    price: sellingPrice(product), images: product.image ? [product.image] : [], stock: 99,
    is_active: true, colors: product.colors || [], color_variants: product.colorVariants || [],
  } as Product;
  const open = () => (store.openProduct || store.addToCart)(asProduct);
  const colors = product.colors || [];
  return (
    <div className="group">
      <button type="button" onClick={open} className="relative block aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        <Img src={product.image} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {product.offer && product.offerPercent ? (
          <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: "var(--brand-primary)" }}>-{product.offerPercent}%</span>
        ) : null}
      </button>
      <h3 onClick={open} className="mt-3 line-clamp-1 cursor-pointer text-sm text-neutral-800">{product.name}</h3>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="text-sm font-semibold">{formatNaira(sellingPrice(product))}</span>
        {originalPrice(product) ? <span className="text-xs text-neutral-400 line-through">{formatNaira(originalPrice(product)!)}</span> : null}
      </div>
      {colors.length ? (
        <div className="mt-2 flex gap-1.5">
          {colors.slice(0, 5).map((c, i) => <span key={i} title={c} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/15" style={{ background: colorHex(c) }} />)}
        </div>
      ) : null}
    </div>
  );
}

function ShopGrid({ siteData }: { siteData: SiteData }) {
  const products = siteData.products || [];
  const cats = productCategories(products).map((c) => c.name);
  const colorOptions = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) for (const c of p.colors || []) { const v = c.trim(); if (v && !seen.includes(v)) seen.push(v); }
    return seen;
  }, [products]);

  const [cat, setCat] = useState("");
  const [color, setColor] = useState("");
  const [sort, setSort] = useState("default");
  const [cols, setCols] = useState<3 | 4>(4);

  let shown = products.filter((p) =>
    (!cat || slug(p.category || "") === slug(cat)) &&
    (!color || (p.colors || []).some((c) => slug(c) === slug(color)))
  );
  if (sort === "low") shown = [...shown].sort((a, b) => sellingPrice(a) - sellingPrice(b));
  if (sort === "high") shown = [...shown].sort((a, b) => sellingPrice(b) - sellingPrice(a));

  const selectCls = "rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none";
  const gridCols = cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  return (
    <section id="shop" className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-black/50">Filter by</span>
          {cats.length > 0 && (
            <select value={cat} onChange={(e) => setCat(e.target.value)} className={selectCls}>
              <option value="">All categories</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {colorOptions.length > 0 && (
            <select value={color} onChange={(e) => setColor(e.target.value)} className={selectCls}>
              <option value="">All colours</option>
              {colorOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
            <option value="default">Default sorting</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
          <div className="hidden items-center gap-1 sm:flex">
            <button aria-label="3 columns" onClick={() => setCols(3)} className={cols === 3 ? "text-black" : "text-black/30"}><LayoutGrid className="h-5 w-5" /></button>
            <button aria-label="4 columns" onClick={() => setCols(4)} className={cols === 4 ? "text-black" : "text-black/30"}><Grid3x3 className="h-5 w-5" /></button>
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-center text-sm text-black/50">Products you add in your dashboard appear here. Adjust the filters to see more.</p>
      ) : (
        <div className={`mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 ${gridCols}`}>
          {shown.map((p) => <GuzaCard key={p.id} product={p} siteData={siteData} />)}
        </div>
      )}
    </section>
  );
}

export function Guza({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Guza";

  const blocks: Record<string, React.ReactNode> = {
    donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
    banner: siteData.sectionImages?.banner ? (
      <section className="mx-auto max-w-6xl px-5 py-6"><Img src={siteData.sectionImages.banner} className="w-full rounded-2xl object-cover" /></section>
    ) : null,
    hero: (
      <section className="bg-[#F1EEE9]">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-5 py-12 sm:py-16 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold sm:text-6xl">{siteData.heroHeadline || "Shop"}</h1>
            <p className="mt-3 text-sm text-black/50">
              <a href="#" className="hover:text-black">Home</a> <span className="px-1">›</span> {siteData.heroHeadline || "Shop"}
            </p>
          </div>
          {siteData.heroImage ? <Img src={siteData.heroImage} className="ml-auto h-40 w-full max-w-xl rounded-2xl object-cover sm:h-56" /> : null}
        </div>
      </section>
    ),
    shop: <ShopGrid siteData={siteData} />,
  };

  const footerLinks: [string, string[]][] = [
    ["Company", ["About Us", "Blog", "Careers", "Locations"]],
    ["Customer Care", ["Size Guide", "Help & FAQs", "Return My Order", "Refer a Friend"]],
    ["Terms & Policies", ["Duties & Taxes", "Shipping Info", "Privacy Policy", "Terms & Conditions"]],
  ];

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      <header className="border-b border-black/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Brandmark siteData={siteData} name={name} className="text-2xl font-extrabold" />
          <nav className="hidden gap-7 text-sm text-black/70 lg:flex">
            {navItems(siteData, [["Home", "#"], ["Shop", "#shop"], ["Products", "#shop"], ["Blog", "#"]]).map(([l, h]) => <a key={l} href={h} className="hover:text-black">{l}</a>)}
          </nav>
          <div className="flex items-center gap-4 text-black/80">
            <Search className="hidden h-5 w-5 sm:block" />
            <Heart className="hidden h-5 w-5 sm:block" />
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "shop", "banner", "donation"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />

      <footer className="bg-[#171717] text-white/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-2xl font-bold leading-snug text-white">Receive an exclusive <span style={{ color: "var(--brand-primary)" }}>20%</span> discount code when you signup.</p>
            <div className="mt-4 flex max-w-sm items-center gap-2 border-b border-white/30 pb-1">
              <input className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-white placeholder:text-white/40 outline-none" placeholder="Enter your email" />
              <button className="text-sm font-semibold text-white">Subscribe</button>
            </div>
          </div>
          {footerLinks.map(([title, items]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white">{title}</h4>
              <ul className="mt-3 space-y-2 text-sm">{items.map((it) => <li key={it}><a href="#" className="hover:text-white">{it}</a></li>)}</ul>
            </div>
          ))}
          <div>
            <h4 className="text-sm font-semibold text-white">Follow us</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {([["Instagram", "instagram"], ["Facebook", "facebook"], ["TikTok", "tiktok"], ["Website", "website"]] as const).map(([label, key]) => {
                const v = siteData.social?.[key];
                return <li key={label}><a href={v || "#"} target={v ? "_blank" : undefined} rel="noreferrer" className="hover:text-white">{label}</a></li>;
              })}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-5 text-sm text-white/50 sm:flex-row">
            <span className="font-bold text-white">{name} <span className="font-normal text-white/40">© {new Date().getFullYear()}. Built with Tomora.</span></span>
            <div className="flex items-center gap-2">
              {["VISA", "MC", "Stripe", "PayPal"].map((p) => (
                <span key={p} className="rounded bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/70">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </BrandStyle>
  );
}
