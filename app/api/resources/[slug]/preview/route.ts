import { NextResponse, type NextRequest } from "next/server";
import { getResource, hasPurchased } from "@/lib/resources/db";
import { ACCESS_COOKIE, readAccessToken } from "@/lib/resources/access";

/**
 * Serves the iframe preview for a resource.
 *
 * The preview used to be inlined into the gallery with srcDoc, which put the
 * full source of every paid resource into the page HTML: one request to
 * /resources handed over the entire catalogue. Now it is fetched per frame,
 * and for a resource the visitor has not paid for it is only served to an
 * actual same-origin iframe, so it cannot be curled or opened directly.
 *
 * A live HTML preview can still be read out of the DOM with devtools. That is
 * inherent to previewing markup as markup; what stays genuinely gated is the
 * prompt, the tidy downloadable file and the comments explaining the build.
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const resource = await getResource(params.slug);
  if (!resource || !resource.is_published) {
    return new NextResponse("Not found", { status: 404 });
  }

  let entitled = !resource.is_paid;
  if (!entitled) {
    const email = readAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
    entitled = !!email && (await hasPurchased(resource.id, email));
  }

  if (!entitled) {
    // Only a real same-origin iframe may render an unpaid preview.
    const dest = request.headers.get("sec-fetch-dest");
    const site = request.headers.get("sec-fetch-site");
    if (dest !== "iframe" || (site && site !== "same-origin")) {
      return new NextResponse("Preview is only available on the Tomora resources pages.", {
        status: 403,
      });
    }
  }

  const html = resource.preview_html || resource.html_code;

  return new NextResponse(entitled ? html : stripComments(html), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/**
 * Removes HTML and CSS comments from an unpaid preview. The render is
 * identical, but the annotations that explain how the effect is built (a real
 * part of what is being sold) do not go out with it.
 */
function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}
