"use client";

import { contrastText } from "@/lib/utils";

/**
 * Injects brand-color CSS variables onto a wrapper element. Every v2 template
 * references these variables instead of hardcoding accent colors, so a user's
 * brandColor overrides the template's default accent globally.
 *
 *   --brand-primary          the user's brand color (or template default)
 *   --brand-primary-light    ~15% tint toward white
 *   --brand-primary-dark     ~20% toward black
 *   --brand-on-primary       readable text color on the brand color
 *   --brand-secondary        optional secondary brand color
 */
export function brandVars(
  brandColor: string,
  secondary?: string
): React.CSSProperties {
  return {
    ["--brand-primary" as any]: brandColor,
    ["--brand-primary-light" as any]: `color-mix(in srgb, ${brandColor} 15%, white)`,
    ["--brand-primary-dark" as any]: `color-mix(in srgb, ${brandColor} 80%, black)`,
    ["--brand-on-primary" as any]: contrastText(brandColor),
    ["--brand-secondary" as any]: secondary || brandColor,
  };
}

export function BrandStyle({
  brandColor,
  secondary,
  className,
  children,
}: {
  brandColor: string;
  secondary?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className} style={brandVars(brandColor, secondary)}>
      {children}
    </div>
  );
}
