import { NextResponse, type NextRequest } from "next/server";
import { settleResourcePurchase } from "@/lib/resources/purchase";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, makeAccessToken } from "@/lib/resources/access";

/**
 * Called by the browser the moment Paystack reports success. Settles the
 * purchase and drops the signed access cookie so the resource unlocks without
 * waiting on the webhook or on the buyer opening their email.
 */
export async function POST(request: NextRequest) {
  let reference = "";
  try {
    reference = String(((await request.json()) as { reference?: string }).reference || "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await settleResourcePurchase(reference);
  if (!result.ok || !result.email) {
    return NextResponse.json({ error: result.error || "Could not confirm." }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, slug: result.slug });
  res.cookies.set(ACCESS_COOKIE, makeAccessToken(result.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  return res;
}
