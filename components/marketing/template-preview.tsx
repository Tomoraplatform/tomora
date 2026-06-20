"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SiteRenderer } from "@/components/templates";
import { createCatalogContent } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const VIRTUAL_WIDTH = 1280; // render at desktop width, then scale to fit

/**
 * Renders a real template (with demo content) at desktop width and scales it
 * down to the container, so previews keep correct proportions (no shrunk text)
 * and stay responsive. `autoScroll` animates the content vertically (hero).
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
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / VIRTUAL_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(
    () => createCatalogContent(templateId, { businessName, brandColor }),
    [templateId, businessName, brandColor]
  );

  return (
    <div ref={ref} className={cn("relative w-full overflow-hidden bg-white", className)}>
      <div style={{ width: VIRTUAL_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <div className={autoScroll ? "animate-autoscroll" : undefined}>
          <div className="pointer-events-none select-none" aria-hidden="true">
            <SiteRenderer templateId={templateId} siteData={data} brandColor={brandColor} />
          </div>
        </div>
      </div>
    </div>
  );
}
