import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import type { SupportMessage } from "@/lib/database.types";
import { MessagesInbox, type Conversation } from "@/components/dashboard/messages-inbox";

export const metadata = { title: "Messages | Tomora" };

export default async function MessagesPage() {
  const { site } = await getDashboardData();

  const supabase = createClient();
  const { data } = await supabase
    .from("support_messages")
    .select("*")
    .eq("site_id", site!.id)
    .order("created_at", { ascending: true });
  const rows = (data as SupportMessage[]) || [];

  // Group messages into conversations.
  const map = new Map<string, Conversation>();
  for (const m of rows) {
    let c = map.get(m.conversation_id);
    if (!c) {
      c = { conversationId: m.conversation_id, name: "", email: null, messages: [], unread: 0, lastAt: m.created_at };
      map.set(m.conversation_id, c);
    }
    c.messages.push({ id: m.id, sender: m.sender, body: m.body, created_at: m.created_at });
    c.lastAt = m.created_at;
    if (m.sender === "visitor") {
      if (m.name) c.name = m.name;
      if (m.email) c.email = m.email;
      if (!m.seen) c.unread += 1;
    }
  }

  // Most recently active first.
  const conversations = Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Messages</h1>
        <p className="mt-1 text-ink/60">
          Replies to visitors who message you through the chat widget on your site.
        </p>
      </div>
      <MessagesInbox conversations={conversations} />
    </div>
  );
}
