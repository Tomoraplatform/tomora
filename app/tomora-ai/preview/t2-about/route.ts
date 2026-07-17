import { renderT2 } from "@/lib/tomora-ai/t2";

/** Internal preview of Tomora AI template 2 (Chronova), about page. */
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(renderT2("about"), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}
