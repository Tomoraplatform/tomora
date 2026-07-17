"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/database.types";
import type { CartLine } from "../cart-drawer";

interface StoredLine { productId: string; qty: number; color?: string; }

/**
 * Cart persisted to localStorage (keyed by site) so it survives real page
 * navigations between the home / category / product pages, unlike the
 * single-page templates, this template's pages are genuine full loads.
 */
export function useStoreCart(siteId: string, catalog: Product[]) {
  const key = `tomora_cart_${siteId}`;
  const [lines, setLinesState] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once, resolving stored ids against the current catalog.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      const stored: StoredLine[] = raw ? JSON.parse(raw) : [];
      const resolved = stored
        .map((s) => {
          const product = catalog.find((p) => p.id === s.productId);
          return product ? { product, qty: s.qty, color: s.color } : null;
        })
        .filter(Boolean) as CartLine[];
      setLinesState(resolved);
    } catch {
      setLinesState([]);
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useCallback((next: CartLine[]) => {
    setLinesState(next);
    try {
      const stored: StoredLine[] = next.map((l) => ({ productId: l.product.id, qty: l.qty, color: l.color }));
      window.localStorage.setItem(key, JSON.stringify(stored));
    } catch { /* ignore (private mode / storage full) */ }
  }, [key]);

  const add = useCallback((product: Product, color?: string, qty = 1) => {
    setLinesState((prev) => {
      const same = (l: CartLine) => l.product.id === product.id && l.color === color;
      const next = prev.some(same)
        ? prev.map((l) => same(l) ? { ...l, qty: l.qty + qty } : l)
        : [...prev, { product, qty, color }];
      persist(next);
      return next;
    });
  }, [persist]);

  const setQty = useCallback((id: string, color: string | undefined, delta: number) => {
    setLinesState((prev) => {
      const next = prev.flatMap((l) => {
        if (!(l.product.id === id && l.color === color)) return [l];
        const qty = l.qty + delta;
        return qty <= 0 ? [] : [{ ...l, qty }];
      });
      persist(next);
      return next;
    });
  }, [persist]);

  const count = lines.reduce((n, l) => n + l.qty, 0);

  return { lines, add, setQty, count, hydrated };
}
