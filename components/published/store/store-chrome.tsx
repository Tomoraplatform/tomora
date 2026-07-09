"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { Search, User, ShoppingCart, Loader2, Check } from "lucide-react";
import type { Product, SiteData } from "@/lib/database.types";
import { contrastText, slugify } from "@/lib/utils";
import { CartDrawer } from "../cart-drawer";
import { SocialIcons } from "@/components/templates/v2/shared";
import { useStoreCart } from "./use-store-cart";

interface StoreCartApi {
  add: (product: Product, color?: string, qty?: number) => void;
  buyNow: (product: Product, color?: string, qty?: number) => void;
  count: number;
}

const StoreCartContext = createContext<StoreCartApi>({ add: () => {}, buyNow: () => {}, count: 0 });
export const useStoreCartApi = () => useContext(StoreCartContext);

/**
 * Shared header + footer + cart for the Bakehouse live storefront (home,
 * category and product pages). Cart persists across full page loads via
 * localStorage — see use-store-cart.ts.
 */
export function StoreChrome({
  siteData, brandColor, siteId, products, bankName, accountNumber, accountName, paystackEnabled, children,
}: {
  siteData: SiteData;
  brandColor: string;
  siteId: string;
  products: Product[];
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  paystackEnabled?: boolean;
  children: React.ReactNode;
}) {
  const name = siteData.businessName || "Store";
  const { lines, add, setQty, count } = useStoreCart(siteId, products);
  const [open, setOpen] = useState(false);
  const [startAtCheckout, setStartAtCheckout] = useState(false);

  const cartApi: StoreCartApi = {
    add: (product, color, qty) => { add(product, color, qty); setStartAtCheckout(false); setOpen(true); },
    buyNow: (product, color, qty) => { add(product, color, qty ?? 1); setStartAtCheckout(true); setOpen(true); },
    count,
  };

  const quickCats = (siteData.shopCategories || []).slice(0, 2);

  return (
    <StoreCartContext.Provider value={cartApi}>
      <div className="min-h-screen bg-white font-sans text-neutral-900" style={{ ["--brand-primary" as any]: brandColor, ["--brand-on-primary" as any]: contrastText(brandColor) }}>
        <header className="border-b border-black/5">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <nav className="order-2 hidden gap-4 text-[11px] font-semibold uppercase tracking-wide text-black/70 sm:order-1 md:flex">
              {quickCats.map((c) => (
                <Link key={c.id} href={`/category/${slugify(c.name)}`} className="hover:opacity-70">{c.name}</Link>
              ))}
            </nav>
            <div className="order-1 flex items-center justify-between sm:order-2 sm:justify-center">
              <Link href="/" className="text-lg font-bold">
                {siteData.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={siteData.logoUrl} alt={name} className="h-9 w-auto object-contain" />
                ) : name}
              </Link>
            </div>
            <div className="order-3 flex items-center justify-end gap-4 text-black/70">
              <Search className="h-5 w-5" aria-hidden="true" />
              <User className="h-5 w-5" aria-hidden="true" />
              <button onClick={() => { setStartAtCheckout(false); setOpen(true); }} className="relative" aria-label="Open cart">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: brandColor }}>{count}</span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-black/5 bg-[#FAF7F2]">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
            <div>
              <p className="text-lg font-bold">{name}</p>
              <SocialIcons social={siteData.social} className="mt-3 text-black/60" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-black/50">Get in touch</h4>
              <div className="mt-3 space-y-1 text-sm text-black/60">
                {siteData.address && <p>{siteData.address}</p>}
                {siteData.phone && <p>{siteData.phone}</p>}
                {siteData.email && <p>{siteData.email}</p>}
              </div>
            </div>
            <NewsletterBlock siteId={siteId} />
          </div>
          <div className="border-t border-black/5 py-5 text-center text-sm text-black/40">© {new Date().getFullYear()} {name}. Built with Tomora.</div>
        </footer>
      </div>

      <CartDrawer
        open={open} onClose={() => setOpen(false)} lines={lines} setQty={setQty}
        siteData={siteData} brandColor={brandColor} siteId={siteId}
        bankName={bankName} accountNumber={accountNumber} accountName={accountName} paystackEnabled={paystackEnabled}
        startAtCheckout={startAtCheckout}
      />
    </StoreCartContext.Provider>
  );
}

function NewsletterBlock({ siteId }: { siteId: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function join() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, email, source: "newsletter" }),
      });
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-black/50">Newsletter</h4>
      <p className="mt-2 text-sm text-black/60">Join our world and receive early access to new drops and private events.</p>
      {done ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-black"><Check className="h-4 w-4" /> Thanks for subscribing!</p>
      ) : (
        <div className="mt-3 flex items-center gap-2 border-b border-black/20 pb-1">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <button onClick={join} disabled={busy} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Join
          </button>
        </div>
      )}
    </div>
  );
}
