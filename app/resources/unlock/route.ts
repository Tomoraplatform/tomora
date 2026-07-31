import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, readAccessToken } from "@/lib/resources/access";

/**
 * The link emailed after a purchase. It carries a signed token, so opening it
 * on a new device restores everything that email has bought.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const email = readAccessToken(token);
  const base = request.nextUrl.origin;

  if (!email) {
    return NextResponse.redirect(`${base}/resources?unlock=invalid`);
  }

  const res = NextResponse.redirect(`${base}/resources?unlock=ok`);
  res.cookies.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  return res;
}
