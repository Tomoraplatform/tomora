/**
 * TikTok pixel + Events API.
 *
 * Two deliberate boundaries:
 *
 * 1. This measures **Tomora's own** funnel, not the shops Tomora hosts. The
 *    pixel never loads on a published customer storefront: those visitors are a
 *    seller's customers, and firing Tomora's pixel there would quietly ship
 *    their shoppers into Tomora's ad account.
 *
 * 2. The pixel id is public by nature, it appears in page source. The Events
 *    API access token is not, and lives only in a server environment variable.
 */

/**
 * Public pixel ids. Overridable per environment, with the live one as default.
 *
 * Comma-separate the variable to run more than one pixel at once, which is what
 * a second TikTok ad account needs. TikTok's base code is built for this: each
 * id gets its own `ttq.load`, and the global `ttq.page()` / `ttq.track()` then
 * report to every loaded pixel.
 */
export const TIKTOK_PIXEL_IDS: string[] = (
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "DA3I503C77UAMATN4NG0"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

/**
 * The primary pixel: the first id listed. Server-side events name one pixel per
 * request, so this is the one used when only a single access token is set.
 */
export const TIKTOK_PIXEL_ID = TIKTOK_PIXEL_IDS[0];

/** TikTok's standard event names, spelled the way their API expects. */
export const TIKTOK_EVENTS = {
  registration: "CompleteRegistration",
  subscribe: "Subscribe",
  purchase: "CompletePayment",
  startCheckout: "InitiateCheckout",
} as const;

/**
 * Hosts the pixel is allowed to run on: Tomora's own app and marketing site.
 * A tenant subdomain or a seller's custom domain is never one of these.
 */
export function isTomoraHost(hostname: string): boolean {
  const host = (hostname || "").toLowerCase().split(":")[0];
  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN || "tomora.com.ng").toLowerCase();
  if (host === appDomain || host === `www.${appDomain}`) return true;
  if (host.endsWith(".vercel.app")) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
}
