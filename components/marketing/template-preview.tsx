"use client";

import { useMemo } from "react";
import { SiteRenderer } from "@/components/templates";
import { createCatalogContent } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Renders a real template (with demo content) as a non-interactive preview.
 * Used on the marketing page so visitors see actual site UI, not wireframes.
 * `autoScroll` animates the content vertically for the hero.
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
  const data = useMemo(
    () => createCatalogContent(templateId, { businessName, brandColor }),
    [templateId, businessName, brandColor]
  );

  return (
    <div className={cn("relative w-full overflow-hidden bg-white", className)}>
      <div className={autoScroll ? "animate-autoscroll" : undefined}>
        <div className="pointer-events-none select-none" aria-hidden="true">
          <SiteRenderer templateId={templateId} siteData={data} brandColor={brandColor} />
        </div>
      </div>
    </div>
  );
}
