import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "tomora.com";
const PROTECTED = ["/dashboard", "/onboarding", "/admin"];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

/**
 * Returns the tenant subdomain (or custom domain marker) for a host, or null
 * when the request targets the main marketing/app site.
 */
function getTenant(host: string): { type: "subdomain" | "custom"; value: string } | null {
  const hostname = host.split(":")[0].toLowerCase();

  // Local development: support `tenant.localhost`
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    return sub && sub !== "www" ? { type: "subdomain", value: sub } : null;
  }
  if (hostname === "localhost") return null;

  const isAppHost =
    hostname === APP_DOMAIN ||
    hostname === `www.${APP_DOMAIN}` ||
    hostname.endsWith(".vercel.app");

  if (isAppHost) return null;

  if (hostname.endsWith(`.${APP_DOMAIN}`)) {
    const sub = hostname.slice(0, -(`.${APP_DOMAIN}`.length));
    return sub && sub !== "www" ? { type: "subdomain", value: sub } : null;
  }

  // Anything else is a connected custom domain.
  return { type: "custom", value: hostname };
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const url = request.nextUrl;
  const host = request.headers.get("host") || "";
  const tenant = getTenant(host);

  // ---- Tenant (published site) routing ----
  if (tenant) {
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = `/sites/${tenant.type}/${encodeURIComponent(
      tenant.value
    )}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  // The internal /sites/* tree is only reachable via tenant rewrites above.
  if (url.pathname.startsWith("/sites/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // ---- Main app: auth gating ----
  const path = url.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (isAuthPage && user) {
    const redirect = url.clone();
    redirect.pathname = "/dashboard";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next static & image optimisation
     * - favicon and common static assets
     * - api/webhooks (Paystack must reach these regardless of host)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
