import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public endpoint for storefront visitors to leave a review + rating. */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { siteId, name, rating, comment, email, productId } = body || {};
  const r = Math.round(Number(rating));
  if (!siteId || !name?.trim() || !(r >= 1 && r <= 5)) {
    return NextResponse.json({ error: "Name and a 1–5 rating are required." }, { status: 400 });
  }

  // Only accept reviews for live e-commerce sites.
  const { data: site } = await admin
    .from("sites").select("id, is_live, category").eq("id", siteId).maybeSingle();
  if (!site || !site.is_live || site.category !== "ecommerce") {
    return NextResponse.json({ error: "Reviews are not available for this store." }, { status: 400 });
  }

  const { error } = await admin.from("reviews").insert({
    site_id: siteId,
    product_id: productId || null,
    reviewer_name: String(name).slice(0, 80),
    reviewer_email: email ? String(email).slice(0, 120) : null,
    rating: r,
    comment: comment ? String(comment).slice(0, 1000) : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
