import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const STUDENT_PREFIXES = ["/dashboard", "/course", "/module", "/complete"];
const ADMIN_PREFIXES = ["/admin/dashboard"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: refreshes the session and keeps cookies in sync.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsStudent = STUDENT_PREFIXES.some((p) => path.startsWith(p));
  const needsAdmin = ADMIN_PREFIXES.some((p) => path.startsWith(p));

  if ((needsStudent || needsAdmin) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = needsAdmin ? "/admin/login" : "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Fine-grained approval/admin checks happen in the pages themselves
  // (server components) where we can query the DB. Middleware only guards
  // the authenticated boundary.

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/course/:path*",
    "/module/:path*",
    "/complete",
    "/admin/:path*",
  ],
};
