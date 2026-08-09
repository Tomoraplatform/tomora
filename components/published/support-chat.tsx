"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { contrastText } from "@/lib/utils";
import { onOpenSupport } from "@/lib/support-bus";

interface Msg { id?: string; sender: "visitor" | "owner"; body: string; created_at?: string; }

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function SupportChat({
  siteId, brandColor, inBottomBar = false,
}: {
  siteId: string;
  brandColor: string;
  /** The template shows a Support tab on phones, so the floating launcher is
   *  desktop-only here and the tab opens the chat through the event bus. */
  inBottomBar?: boolean;
}) {
  const onBrand = contrastText(brandColor);
  const [open, setOpen] = useState(false);

  // A template's bottom bar asks for the chat through the shared event.
  useEffect(() => onOpenSupport(() => setOpen(true)), []);
  const [convId, setConvId] = useState<string | null>(null);
  const [identified, setIdentified] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storeKey = `tomora_chat_${siteId}`;

  // Restore an existing conversation from this browser.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.convId) { setConvId(saved.convId); setName(saved.name || ""); setEmail(saved.email || ""); setIdentified(true); }
      }
    } catch { /* ignore */ }
  }, [storeKey]);

  const refresh = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/support/thread?siteId=${siteId}&conversationId=${id}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) setMessages(data.messages);
    } catch { /* ignore */ }
  }, [siteId]);

  // Poll for owner replies while the chat is open.
  useEffect(() => {
    if (!open || !convId) return;
    refresh(convId);
    const t = setInterval(() => refresh(convId), 5000);
    return () => clearInterval(t);
  }, [open, convId, refresh]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function start() {
    if (!name.trim()) return;
    const id = convId || uuid();
    setConvId(id);
    setIdentified(true);
    try { localStorage.setItem(storeKey, JSON.stringify({ convId: id, name: name.trim(), email: email.trim() })); } catch { /* ignore */ }
  }

  async function send() {
    const text = draft.trim();
    if (!text || !convId) return;
    setSending(true);
    setMessages((m) => [...m, { sender: "visitor", body: text }]);
    setDraft("");
    try {
      await fetch("/api/support/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, conversationId: convId, name, email, body: text }),
      });
      refresh(convId);
    } catch { /* ignore */ }
    setSending(false);
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 left-6 z-40 h-14 w-14 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 ${inBottomBar ? "hidden lg:flex" : "flex"}`}
        style={{ background: brandColor, color: onBrand }}
        aria-label="Chat with us"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className={`fixed left-6 z-40 flex h-[28rem] max-h-[70vh] w-[20rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl ${inBottomBar ? "bottom-24 lg:bottom-24" : "bottom-24"}`}>
          {/* The panel closes from its own header. The launcher doubles as a
              close button, but it is hidden on a phone where the bottom bar
              opens this instead, so without it there was no way back out. */}
          <div className="flex items-start gap-2 px-4 py-3" style={{ background: brandColor, color: onBrand }}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Chat with us</p>
              <p className="text-xs opacity-80">We typically reply within a few hours.</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="-mr-1 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-black/10 active:scale-95"
              style={{ color: onBrand }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!identified ? (
            <div className="flex flex-1 flex-col gap-3 p-4">
              <p className="text-sm text-ink/70">Tell us who you are to start the chat.</p>
              <input
                value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink/40"
              />
              <input
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" type="email"
                className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink/40"
              />
              <button
                onClick={start} disabled={!name.trim()}
                className="mt-auto rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ background: brandColor, color: onBrand }}
              >
                Start chat
              </button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-cream/40 p-3">
                {messages.length === 0 && (
                  <p className="px-1 py-2 text-center text-xs text-ink/50">Send a message and we&apos;ll get back to you here.</p>
                )}
                {messages.map((m, i) => (
                  <div key={m.id || i} className={`flex ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                      style={m.sender === "visitor"
                        ? { background: brandColor, color: onBrand }
                        : { background: "#fff", color: "#022245", border: "1px solid rgba(0,0,0,0.08)" }}
                    >
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-ink/10 p-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border border-ink/15 px-4 py-2 text-sm outline-none focus:border-ink/40"
                />
                <button
                  onClick={send} disabled={sending || !draft.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
                  style={{ background: brandColor, color: onBrand }}
                  aria-label="Send"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
