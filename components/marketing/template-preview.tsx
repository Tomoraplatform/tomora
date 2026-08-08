"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SiteRenderer } from "@/components/templates";
import { createCatalogContent, richStoreCatalog } from "@/lib/catalog";
import type { SiteData } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const DESKTOP_WIDTH = 1280;

/**
 * Renders a real template (demo content) as a non-interactive preview.
 * - Desktop: renders at desktop width and scales down (mini-website look).
 * - Mobile: renders natively at the container width (the template's real
 *   responsive mobile layout, full size & legible).
 */
export function TemplatePreview({
  templateId,
  brandColor = "#022245",
  businessName = "Your Brand",
  autoScroll = false,
  className,
  heroOverride,
  richCatalog = false,
  siteDataOverride,
  lazy = false,
}: {
  templateId: string;
  brandColor?: string;
  businessName?: string;
  autoScroll?: boolean;
  className?: string;
  /** Build the preview only once it is near the viewport. A page showing a
   *  gallery of these otherwise ships every template's whole storefront in its
   *  HTML, for previews the visitor may never scroll to. */
  lazy?: boolean;
  /** Override the hero image for this preview only (keeps the landing neutral). */
  heroOverride?: string;
  /** Marketing use only: swap in a fuller, multi-category catalog so the
   *  store looks fully set up (many products per category) rather than the
   *  sparse starter content real onboarding seeds. */
  richCatalog?: boolean;
  /** Render a real site's saved content instead of the demo catalog, so a
   *  dashboard thumbnail shows the owner's own edits. */
  siteDataOverride?: SiteData;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(DESKTOP_WIDTH);
  const [scale, setScale] = useState(0.3);
  const [shown, setShown] = useState(!lazy);

  // Start building a little before the preview is scrolled to, so it is ready
  // by the time it is actually on screen.
  useEffect(() => {
    if (!lazy || shown) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setShown(true)),
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, shown]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const cw = el.clientWidth;
      if (window.innerWidth < 768) {
        setVw(cw); // native mobile render
        setScale(1);
      } else {
        setVw(DESKTOP_WIDTH);
        setScale(cw / DESKTOP_WIDTH);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const data = useMemo(
    () => {
      if (siteDataOverride) return siteDataOverride;
      const d = createCatalogContent(templateId, { businessName, brandColor });
      if (heroOverride) d.heroImage = heroOverride;
      if (richCatalog && d.products?.length) {
        const { products, categories } = richStoreCatalog(templateId);
        d.products = products;
        d.shopCategories = categories;
        d.testimonials = [
          { id: "rt1", name: "Amara O.", role: "Customer", quote: "Beautiful pieces and my order arrived so fast. This is now my go-to store!" },
          { id: "rt2", name: "Tunde B.", role: "Customer", quote: "Quality is even better than the photos. Checkout was smooth too." },
          { id: "rt3", name: "Grace M.", role: "Customer", quote: "Loved the packaging and the customer support was excellent." },
        ];
      }
      return d;
    },
    [templateId, businessName, brandColor, heroOverride, richCatalog, siteDataOverride]
  );

  return (
    <div ref={ref} className={cn("relative w-full overflow-hidden bg-white", className)}>
      {shown ? (
        <div style={{ width: vw, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div className={autoScroll ? "animate-autoscroll" : undefined}>
            <div className="pointer-events-none select-none" aria-hidden="true">
              <SiteRenderer templateId={templateId} siteData={data} brandColor={brandColor} />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full animate-pulse bg-ink/[0.04]" aria-hidden="true" />
      )}
    </div>
  );
}
