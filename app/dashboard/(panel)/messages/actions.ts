"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentSiteId } from "@/lib/dashboard";

async function requireSite() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const siteId = await currentSiteId(user.id);
  if (!siteId) throw new Error("No site found.");
  return { userId: user.id, siteId };
}

/** Owner replies to a visitor's conversation. */
export async function replyToConversation(conversationId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { siteId } = await requireSite();
    const text = String(body || "").trim();
    if (!text) return { ok: false, error: "Empty message." };

    const admin = createAdminClient();
    // Verify the conversation belongs to this owner's current site.
    const { data: convo } = await admin
      .from("support_messages")
      .select("id")
      .eq("site_id", siteId)
      .eq("conversation_id", conversationId)
      .limit(1)
      .maybeSingle();
    if (!convo) return { ok: false, error: "Conversation not found." };

    const { error } = await admin.from("support_messages").insert({
      site_id: siteId,
      conversation_id: conversationId,
      sender: "owner",
      body: text.slice(0, 2000),
      seen: true,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/messages");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Marks all of a visitor's messages in a conversation as seen by the owner. */
export async function markConversationSeen(conversationId: string): Promise<{ ok: boolean }> {
  try {
    const { siteId } = await requireSite();
    const admin = createAdminClient();
    await admin
      .from("support_messages")
      .update({ seen: true })
      .eq("site_id", siteId)
      .eq("conversation_id", conversationId)
      .eq("sender", "visitor")
      .eq("seen", false);
    revalidatePath("/dashboard/messages");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
