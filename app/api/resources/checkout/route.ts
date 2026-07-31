import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initTransaction } from "@/lib/paystack";
import { getResource } from "@/lib/resources/db";
import { hasPurchased } from "@/lib/resources/db";

/**
 * Starts a guest purchase for one paid resource. No account is created: the
 * buyer gives a name and an email, and the price is read from the resource
 * row, never from the request.
 */
export async function POST(request: NextRequest) {
  let body: { slug?: string; name?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().toLowerCase();
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter your name and a valid email." }, { status: 400 });
  }

  const resource = await getResource(String(body.slug || ""));
  if (!resource || !resource.is_published) {
    return NextResponse.json({ error: "That resource is not available." }, { status: 404 });
  }
  if (!resource.is_paid) {
    return NextResponse.json({ error: "This resource is free, no payment needed." }, { status: 400 });
  }
  if (resource.price <= 0) {
    return NextResponse.json({ error: "This resource has no price set yet." }, { status: 400 });
  }

  // Already bought it: unlock instead of charging twice.
  if (await hasPurchased(resource.id, email)) {
    return NextResponse.json({ ok: true, alreadyOwned: true });
  }

  const admin = createAdminClient();
  const reference = `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { error } = await admin.from("resource_purchases").insert({
    resource_id: resource.id,
    email,
    name,
    amount: resource.price,
    reference,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const init = await initTransaction({
      email,
      amountNaira: resource.price,
      reference,
      callbackUrl: `${origin}/resources/${resource.slug}?paid=1`,
      metadata: {
        custom_fields: [
          { display_name: "Resource", variable_name: "resource", value: resource.title },
        ],
      },
    });
    return NextResponse.json({
      ok: true,
      reference,
      amount: resource.price,
      accessCode: init.access_code,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not start the payment.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
