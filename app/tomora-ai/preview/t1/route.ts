import { renderT1 } from "@/lib/tomora-ai/t1";

/**
 * Internal preview of Tomora AI template 1, serves the exact standalone
 * HTML/CSS document users will later copy. Unlinked and noindexed while the
 * product is in development.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(renderT1(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}
