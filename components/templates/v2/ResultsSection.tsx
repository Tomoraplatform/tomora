"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteData, CatalogResultItem } from "@/lib/database.types";
import { heading, subheading, Img } from "./shared";
import { useTemplateEdit } from "../editor-context";

/** Splits "+150%" / "3.2x" / "₦2.4M" into the parts either side of the number that animates. */
function parseStatValue(raw: string): { prefix: string; target: number; decimals: number; suffix: string } {
  const m = (raw || "").match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
  if (!m) return { prefix: "", target: 0, decimals: 0, suffix: raw || "" };
  const numStr = m[2].replace(/,/g, "");
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  return { prefix: m[1], target: parseFloat(numStr) || 0, decimals, suffix: m[3] };
}

/** Eases 0 → target once `active` flips true (scroll into view), formatted to match the source decimals. */
function useCountUp(active: boolean, target: number, decimals: number, duration = 1400): string {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
}

function ResultCard({ item, brandColor }: { item: CatalogResultItem; brandColor: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); io.disconnect(); } },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { prefix, target, decimals, suffix } = parseStatValue(item.statValue);
  const shown = useCountUp(active, target, decimals);

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
      <div className="grid grid-cols-2">
        <div className="relative aspect-[4/5] bg-black/5">
          <Img src={item.beforeImage} className="h-full w-full object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Before</span>
        </div>
        <div className="relative aspect-[4/5] bg-black/5">
          <Img src={item.afterImage} className="h-full w-full object-cover" />
          <span className="absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: brandColor }}>After</span>
        </div>
      </div>
      <div className="p-5">
        {item.title && <p className="text-sm font-medium text-black/60">{item.title}</p>}
        <p className="mt-1 text-3xl font-bold" style={{ color: brandColor }}>{prefix}{shown}{suffix}</p>
        <p className="mt-1 text-sm text-black/60">{item.statLabel}</p>
      </div>
    </div>
  );
}

/**
 * Before/after case-study cards: paired images plus a stat that counts up
 * from 0 once scrolled into view. Shared across the Portfolio & Creator
 * templates, see beforeAfterResults on SiteData.
 */
export function ResultsSection({
  siteData, brandColor, sectionKey = "beforeAfter",
}: {
  siteData: SiteData;
  brandColor: string;
  sectionKey?: string;
}) {
  const { editing } = useTemplateEdit();
  const items = siteData.beforeAfterResults || [];
  if (items.length === 0 && !editing) return null;

  return (
    <section id={sectionKey} className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-black">{heading(siteData, sectionKey, "Before & After Results")}</h2>
          <p className="mt-2 text-black/60">{subheading(siteData, sectionKey, "Real transformations, backed by real numbers.")}</p>
        </div>
        {items.length === 0 ? (
          <p className="mt-8 text-center text-sm text-black/50">Add before/after photos and a result in the editor to show them here.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => <ResultCard key={item.id} item={item} brandColor={brandColor} />)}
          </div>
        )}
      </div>
    </section>
  );
}
