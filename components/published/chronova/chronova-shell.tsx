import type { Site } from "@/lib/database.types";
import { StoreChrome } from "../store/store-chrome";

export const CHRONOVA_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Wraps a Chronova live page in the shared store chrome with page nav. */
export function ChronovaShell({
  site, paystackEnabled, children,
}: {
  site: Site;
  paystackEnabled: boolean;
  children: React.ReactNode;
}) {
  const siteData = site.site_data;
  const brandColor = siteData?.brandColor || "#2E7DF6";
  return (
    <StoreChrome
      siteData={siteData}
      brandColor={brandColor}
      siteId={site.id}
      products={[]}
      bankName={site.bank_name}
      accountNumber={site.account_number}
      accountName={site.account_name}
      paystackEnabled={paystackEnabled}
      pageLinks={CHRONOVA_LINKS}
    >
      {children}
    </StoreChrome>
  );
}
