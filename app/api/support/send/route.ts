import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Public endpoint: a site visitor sends a message through the chat widget. */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { siteId, conversationId, name, email, body: text } = body || {};
  const message = String(text || "").trim();
  if (!siteId || !conversationId || !message) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 });
  }

  // Only accept messages for live sites.
  const { data: site } = await admin
    .from("sites").select("id, is_live").eq("id", siteId).maybeSingle();
  if (!site || !site.is_live) {
    return NextResponse.json({ error: "Chat is not available." }, { status: 400 });
  }

  const { error } = await admin.from("support_messages").insert({
    site_id: siteId,
    conversation_id: conversationId,
    sender: "visitor",
    name: name ? String(name).slice(0, 120) : null,
    email: email ? String(email).slice(0, 160) : null,
    body: message.slice(0, 2000),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
