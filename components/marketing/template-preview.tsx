"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SiteRenderer } from "@/components/templates";
import { createCatalogContent } from "@/lib/catalog";
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
}: {
  templateId: string;
  brandColor?: string;
  businessName?: string;
  autoScroll?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(DESKTOP_WIDTH);
  const [scale, setScale] = useState(0.3);

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
    () => createCatalogContent(templateId, { businessName, brandColor }),
    [templateId, businessName, brandColor]
  );

  return (
    <div ref={ref} className={cn("relative w-full overflow-hidden bg-white", className)}>
      <div style={{ width: vw, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div className={autoScroll ? "animate-autoscroll" : undefined}>
          <div className="pointer-events-none select-none" aria-hidden="true">
            <SiteRenderer templateId={templateId} siteData={data} brandColor={brandColor} />
          </div>
        </div>
      </div>
    </div>
  );
}
