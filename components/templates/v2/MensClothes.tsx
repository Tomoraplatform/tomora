"use client";

import { Search, ShoppingCart, ArrowRight } from "lucide-react";
import { BrandStyle } from "../brand-style";
import { TemplateProps, Brandmark, SocialIcons, Img, formatNaira, heading, navItems, productCategories, sellingPrice, originalPrice, CustomSections, OrderedSections } from "./shared";
import { DonationSection } from "./DonationSection";
import { useStore } from "../store-context";
import type { CatalogProduct, Product, SiteData } from "@/lib/database.types";

const TABS = ["Tops", "Sweaters", "Jeans", "Coats & Jackets", "Activewear", "Shorts", "Pants"];
const slug = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Card({ product, siteData }: { product: CatalogProduct; siteData: SiteData }) {
  const store = useStore();
  const asProduct = { id: product.id, name: product.name, description: (product as any).description || null, price: sellingPrice(product), images: product.image ? [product.image] : [], stock: 99, is_active: true, colors: product.colors || [], color_variants: product.colorVariants || [] } as Product;
  const add = () => store.addToCart(asProduct);
  const open = () => (store.openProduct || store.addToCart)(asProduct);
  return (
    <div className="group">
      <button type="button" onClick={open} className="relative block aspect-[3/4] w-full overflow-hidden bg-neutral-100"><Img src={product.image} className="h-full w-full object-cover transition-transform group-hover:scale-105" />{product.offer && product.offerPercent ? <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: "var(--brand-primary)" }}>-{product.offerPercent}%</span> : null}</button>
      <p onClick={open} className="mt-3 line-clamp-1 cursor-pointer text-sm text-neutral-700">{product.name}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-semibold">{formatNaira(sellingPrice(product))}</span>
        {originalPrice(product) && <span className="text-sm text-neutral-400 line-through">{formatNaira(originalPrice(product)!)}</span>}
      </div>
      <button onClick={add} className="mt-2 w-full rounded py-2 text-sm font-semibold text-white" style={{ background: "var(--brand-primary)" }}>Add to cart</button>
    </div>
  );
}

export function MensClothes({ siteData, brandColor }: TemplateProps) {
  const name = siteData.businessName || "Men's Clothes";
  const products = siteData.products || [];

  // Categories come from the products' Category field (set in Products backend).
  const cats = productCategories(products);
  const groups = cats
    .map((c) => ({ name: c.name, items: products.filter((p) => (p.category || "").trim() === c.name) }))
    .filter((g) => g.items.length);
  const grouped = new Set(groups.flatMap((g) => g.items.map((p) => p.id)));
  const others = products.filter((p) => !grouped.has(p.id));
  if (others.length) groups.push({ name: "More", items: others });

  const blocks: Record<string, React.ReactNode> = {
    donation: <DonationSection siteData={siteData} brandColor={brandColor} />,
    banner: siteData.sectionImages?.banner ? (
      <section id="banner" className="mx-auto max-w-6xl px-5 py-6"><Img src={siteData.sectionImages.banner} className="w-full rounded-2xl object-cover" /></section>
    ) : null,
    hero: (
      <section className="mx-auto grid max-w-6xl gap-3 px-5 py-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-lg md:col-span-2 md:row-span-2">
          <Img src={siteData.heroImage} className="h-full min-h-[320px] w-full object-cover" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="max-w-sm text-3xl font-bold uppercase leading-tight">{siteData.heroHeadline}</h1>
            <a href="#allproducts" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">Shop now <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
        {[["New Arrivals", "Fresh drops for the season"], ["Big Clearance", "Up to 60% off select styles"]].map(([t, s], i) => (
          <div key={i} className="relative overflow-hidden rounded-lg">
            <Img src={siteData.heroImages?.[i] || `https://picsum.photos/seed/men-banner${i}/600/300`} className="h-40 w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-4 left-4 text-white"><p className="text-lg font-bold uppercase">{t}</p><p className="text-xs text-white/80">{s}</p></div>
          </div>
        ))}
      </section>
    ),
    new: (
      <section id="new" className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-xl font-bold">{heading(siteData, "new", "New products")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => <Card key={p.id} product={p} siteData={siteData} />)}
        </div>
      </section>
    ),
    special: (
      <section className="bg-neutral-50">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <h2 className="text-xl font-bold">{heading(siteData, "special", "Special products")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {products.map((p) => <Card key={p.id} product={{ ...p, comparePrice: p.comparePrice || Math.round(p.price * 1.3) }} siteData={siteData} />)}
          </div>
        </div>
      </section>
    ),
    catbanners: (
      <section className="mx-auto grid max-w-6xl gap-3 px-5 py-10 md:grid-cols-3">
        {cats.map((c, i) => (
          <a key={c.name} href={`#cat-${slug(c.name)}`} className="relative overflow-hidden rounded-lg">
            <Img src={c.image || `https://picsum.photos/seed/men-cat${i}/600/400`} className="h-56 w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-5 left-5 text-white"><p className="text-lg font-bold uppercase">{c.name}</p><p className="text-xs text-white/80">Explore the collection</p></div>
          </a>
        ))}
      </section>
    ),
    allproducts: (
      <section id="allproducts" className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-xl font-bold">{heading(siteData, "allproducts", "All Products")}</h2>
        {groups.length === 0 && <p className="mt-3 text-sm text-neutral-500">Products you add appear here, grouped by category.</p>}
        {groups.map((g) => (
          <div key={g.name} id={`cat-${slug(g.name)}`} className="scroll-mt-24 pt-8 first:pt-4">
            <h3 className="text-base font-semibold">{g.name}</h3>
            <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {g.items.map((p) => <Card key={p.id} product={p} siteData={siteData} />)}
            </div>
          </div>
        ))}
      </section>
    ),
  };

  return (
    <BrandStyle brandColor={brandColor} className="bg-white font-sans text-neutral-900">
      {/* Top navbar */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
          <div>
            <Brandmark siteData={siteData} name={name} className="text-lg font-bold leading-none" />
            <p className="text-[10px] text-neutral-400">The biggest choice on the web</p>
          </div>
          <div className="relative ml-auto hidden flex-1 max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input className="w-full rounded-md border border-neutral-200 py-2 pl-9 pr-3 text-sm" placeholder="Search products" />
          </div>
          <button className="relative ml-auto md:ml-0" aria-label="Cart">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--brand-primary)" }}>0</span>
          </button>
        </div>
        <div className="border-t border-neutral-100">
          <div className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-5 py-2.5 text-sm text-neutral-600">
            {navItems(siteData, [["New","#new"],["Special","#special"],["Shop","#allproducts"]]).map(([l, h]) => <a key={l} href={h} className="whitespace-nowrap hover:text-black">{l}</a>)}
          </div>
        </div>
      </header>

      <CustomSections sections={siteData.customSections} at="top" />
      <OrderedSections siteData={siteData} natural={["hero", "new", "special", "catbanners", "allproducts", "banner", "donation"]} blocks={blocks} />
      <CustomSections sections={siteData.customSections} at="bottom" />
      <footer className="border-t border-neutral-200">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          {[["Information", ["About Us", "Customer Service", "Site Map", "Advanced Search", "Orders and Returns"]], ["Why buy from us", ["Quality", "Fast Delivery", "Secure Payment"]], ["Customer Care", ["Wish List", "My Orders", "Track Order", "Newsletter"]], ["Contacts", ["12 Marina Rd, Lagos", "+234 800 000 0000", "hello@store.com"]]].map(([h, items]: any) => (
            <div key={h}><h4 className="font-semibold">{h}</h4><ul className="mt-3 space-y-2 text-neutral-500">{items.map((x: string) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
        <div className="flex justify-center pb-3 pt-1"><SocialIcons social={siteData.social} className="opacity-70" /></div>
        <div className="border-t border-neutral-100 py-5 text-center text-sm text-neutral-400">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
      </footer>
    </BrandStyle>
  );
}
