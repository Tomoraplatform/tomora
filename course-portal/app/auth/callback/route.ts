import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Handles the magic-link redirect.
 *
 * Our emails send a server-verifiable link:
 *   /auth/callback?token_hash=<hash>&type=magiclink&next=<dest>
 * (We also still accept a PKCE `code` for completeness.)
 *
 * The session cookies are attached DIRECTLY to the redirect response so they
 * always persist — this is what makes the session "stick" after the click.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/dashboard";
  const loginPath = next.startsWith("/admin") ? "/admin/login" : "/login";

  // Success response is created first so auth cookies land on it.
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: any }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error) console.error("[auth/callback] exchangeCode:", error.message);
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type as any) || "email",
    });
    ok = !error;
    if (error) console.error("[auth/callback] verifyOtp:", error.message);
  }

  if (ok) return response;

  // Link missing, expired, already used, or invalid.
  return NextResponse.redirect(`${origin}${loginPath}?error=link_expired`);
}
