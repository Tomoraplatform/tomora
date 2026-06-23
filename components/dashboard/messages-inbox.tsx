"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, MessagesSquare, ArrowLeft } from "lucide-react";
import { replyToConversation, markConversationSeen } from "@/app/dashboard/(panel)/messages/actions";

export interface InboxMessage { id: string; sender: "visitor" | "owner"; body: string; created_at: string; }
export interface Conversation {
  conversationId: string;
  name: string;
  email: string | null;
  messages: InboxMessage[];
  unread: number;
  lastAt: string;
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function MessagesInbox({ conversations }: { conversations: Conversation[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.conversationId ?? null);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.conversationId === selectedId) || null;

  // Refresh periodically so new visitor messages appear while viewing.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(t);
  }, [router]);

  // Mark a conversation seen when opened.
  useEffect(() => {
    if (selected && selected.unread > 0) {
      markConversationSeen(selected.conversationId).then(() => router.refresh());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [selected?.messages.length]);

  function send() {
    const text = draft.trim();
    if (!text || !selected) return;
    setDraft("");
    startTransition(async () => {
      await replyToConversation(selected.conversationId, text);
      router.refresh();
    });
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/20 p-16 text-center">
        <MessagesSquare className="mb-3 h-8 w-8 text-ink/30" />
        <p className="font-medium text-ink">No messages yet</p>
        <p className="mt-1 text-sm text-ink/50">When a visitor uses the chat widget on your site, their messages appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid h-[34rem] overflow-hidden rounded-xl border border-ink/10 bg-white md:grid-cols-[18rem_1fr]">
      {/* Conversation list */}
      <div className={`flex-col overflow-y-auto border-r border-ink/10 ${selected ? "hidden md:flex" : "flex"}`}>
        {conversations.map((c) => (
          <button
            key={c.conversationId}
            onClick={() => setSelectedId(c.conversationId)}
            className={`flex flex-col gap-0.5 border-b border-ink/5 px-4 py-3 text-left transition-colors hover:bg-cream/60 ${selectedId === c.conversationId ? "bg-cream/80" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-ink">{c.name || "Visitor"}</span>
              {c.unread > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1.5 text-xs font-semibold text-cream">{c.unread}</span>
              )}
            </div>
            <span className="truncate text-xs text-ink/50">{c.messages[c.messages.length - 1]?.body}</span>
            <span className="text-[11px] text-ink/40">{timeAgo(c.lastAt)}</span>
          </button>
        ))}
      </div>

      {/* Thread */}
      {selected ? (
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
            <button className="md:hidden" onClick={() => setSelectedId(null)} aria-label="Back"><ArrowLeft className="h-5 w-5 text-ink/60" /></button>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{selected.name || "Visitor"}</p>
              {selected.email && <p className="truncate text-xs text-ink/50">{selected.email}</p>}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-cream/30 p-4">
            {selected.messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "owner" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender === "owner" ? "bg-ink text-cream" : "border border-ink/10 bg-white text-ink"}`}>
                  {m.body}
                  <div className={`mt-1 text-[10px] ${m.sender === "owner" ? "text-cream/60" : "text-ink/40"}`}>{timeAgo(m.created_at)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-ink/10 p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type your reply…"
              className="flex-1 rounded-full border border-ink/15 px-4 py-2 text-sm outline-none focus:border-ink/40"
            />
            <button
              onClick={send} disabled={pending || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-cream disabled:opacity-50"
              aria-label="Send reply"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden items-center justify-center text-sm text-ink/40 md:flex">Select a conversation</div>
      )}
    </div>
  );
}
