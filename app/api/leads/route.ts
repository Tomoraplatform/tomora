import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public endpoint for site visitors to submit a contact / newsletter form. */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { siteId, name, email, phone, message, source } = body || {};
  if (!siteId) {
    return NextResponse.json({ error: "Missing site." }, { status: 400 });
  }
  // Require at least one piece of contact info.
  if (!String(name || "").trim() && !String(email || "").trim() && !String(phone || "").trim()) {
    return NextResponse.json({ error: "Please add your name or contact details." }, { status: 400 });
  }

  // Only accept leads for live sites.
  const { data: site } = await admin
    .from("sites").select("id, is_live").eq("id", siteId).maybeSingle();
  if (!site || !site.is_live) {
    return NextResponse.json({ error: "This form is not available." }, { status: 400 });
  }

  const src = ["contact", "newsletter", "register"].includes(source) ? source : "contact";

  const { error } = await admin.from("leads").insert({
    site_id: siteId,
    name: name ? String(name).slice(0, 120) : null,
    email: email ? String(email).slice(0, 160) : null,
    phone: phone ? String(phone).slice(0, 40) : null,
    message: message ? String(message).slice(0, 2000) : null,
    source: src,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
