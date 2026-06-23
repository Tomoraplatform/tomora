import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Public endpoint: returns the messages in a visitor's conversation so the chat
 * widget can show the owner's replies. The conversation_id is an unguessable
 * UUID generated in the visitor's browser, so it acts as the access token.
 */
export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  const conversationId = searchParams.get("conversationId");
  if (!siteId || !conversationId) {
    return NextResponse.json({ error: "Missing conversation." }, { status: 400 });
  }

  const { data } = await admin
    .from("support_messages")
    .select("id, sender, body, created_at")
    .eq("site_id", siteId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ messages: data || [] });
}
