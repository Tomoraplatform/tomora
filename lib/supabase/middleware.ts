import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session inside middleware and returns both the
 * response (with refreshed cookies) and the current user. Callers use the
 * user to gate protected routes. Signed-out requests skip the round trip
 * entirely, see below.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Middleware runs on nearly every request, and getUser() is a round trip to
  // Supabase. A visitor with no auth cookie cannot have a session, so that call
  // can only ever return null: skip it and save the wait. This is most of the
  // traffic, since every visitor to a published customer site is signed out.
  // Supabase names its session cookies `sb-<project>-auth-token`, chunked as
  // `.0`, `.1` when long. Any `sb-` cookie takes the full path, so no naming
  // variant can quietly log someone out.
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    return { response, user: null, supabase: null };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
