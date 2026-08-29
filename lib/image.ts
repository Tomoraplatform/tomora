/**
 * Serving customer photos at a sensible size.
 *
 * Uploads live in Supabase Storage, which returns the original file exactly as
 * it was taken: a 400KB phone photo behind a 350px-wide card. On a Nigerian
 * mobile connection a page of those takes half a minute to finish, which reads
 * to the person waiting as a site that will not load.
 *
 * Routing them through Next's optimiser resizes them and converts to WebP/AVIF.
 * Only hosts listed in next.config.mjs may be optimised; anything else is
 * returned untouched, because an unlisted host makes the optimiser answer 400
 * and the image would break rather than merely be large.
 */

/** Widths offered to the browser. Matches Next's default deviceSizes. */
const WIDTHS = [384, 640, 828, 1080, 1920];

/** Quality that holds up on photographs without carrying their full weight. */
const QUALITY = 75;

/**
 * Whether this URL can go through the optimiser.
 *
 * Kept in step with `remotePatterns` in next.config.mjs, which derives its
 * Supabase host from the same variable.
 */
export function canOptimise(src: string): boolean {
  if (!src) return false;
  // Same-origin paths are always allowed.
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  if (!/^https:\/\//i.test(src)) return false; // data:, blob:, http:, relative

  try {
    const url = new URL(src);

    // Placeholder photography, used by template previews and by the demo
    // content every new site is seeded with. Served at 800x800 whatever the
    // box, so it is worth resizing for exactly the same reason uploads are.
    if (url.hostname === "picsum.photos") return true;

    if (!url.pathname.startsWith("/storage/v1/object/public/")) return false;

    const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (configured) {
      try {
        return url.hostname === new URL(configured).hostname;
      } catch {
        /* fall through to the suffix check */
      }
    }
    return url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

/** One optimised URL at a given width. */
export function optimisedSrc(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${QUALITY}`;
}

/**
 * A srcset across the standard widths, or undefined when the URL cannot be
 * optimised. Paired with `sizes` so the browser picks the smallest file that
 * still covers the space the image occupies.
 */
export function optimisedSrcSet(src: string): string | undefined {
  if (!canOptimise(src)) return undefined;
  return WIDTHS.map((w) => `${optimisedSrc(src, w)} ${w}w`).join(", ");
}

/**
 * What to actually put in `src`.
 *
 * A mid-sized optimised file rather than the original, so a browser that
 * ignores srcset (or a crawler) still gets something reasonable.
 */
export function optimisedFallback(src: string): string {
  return canOptimise(src) ? optimisedSrc(src, 1080) : src;
}
