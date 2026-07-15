import { renderT2Home } from "@/lib/tomora-ai/t2";

/** Internal preview of Tomora AI template 2 (Chronova watch store — home page). */
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(renderT2Home(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}
