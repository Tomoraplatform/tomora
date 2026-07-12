"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Loader2, ExternalLink, Pencil, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const OPENER =
  "Hi, I'm Nova. I'll build your whole website for you — just answer a few quick questions. First: what kind of website do you need, and what does your business or organisation do?";

export function NovaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: OPENER }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ liveUrl: string; subdomain: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, done]);

  async function send() {
    const content = input.trim();
    if (!content || busy || done) return;
    setError(null);
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/nova", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.done && data.liveUrl) {
        setDone({ liveUrl: data.liveUrl, subdomain: data.subdomain });
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong — please try again.");
      // Roll the user's message back into the input so nothing is lost.
      setMessages(messages);
      setInput(content);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="flex shrink-0 items-center justify-between border-b border-ink/10 bg-white px-4 py-3">
        <Logo />
        <span className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cream">
          <Sparkles className="h-3.5 w-3.5" /> Nova — AI setup
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <div className="flex-1 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "rounded-br-md bg-ink text-cream" : "rounded-bl-md border border-ink/10 bg-white text-ink"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-ink/10 bg-white px-4 py-3 text-sm text-ink/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                {messages.length > 6 ? "Building your website…" : "Thinking…"}
              </div>
            </div>
          )}

          {done && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="flex items-center gap-2 font-semibold text-emerald-800">
                <CheckCircle2 className="h-5 w-5" /> Your website is live!
              </p>
              <p className="mt-1 break-all text-sm text-emerald-700">{done.liveUrl}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  href={done.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-cream"
                >
                  <ExternalLink className="h-4 w-4" /> View my website
                </a>
                <Link
                  href="/dashboard/editor"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-ink/20 bg-white px-4 py-2.5 text-sm font-semibold text-ink"
                >
                  <Pencil className="h-4 w-4" /> Edit it myself
                </Link>
              </div>
              <p className="mt-3 text-xs text-emerald-700/80">
                Tip: open the editor to upload your logo and your own photos — I used tasteful placeholders for now.
              </p>
            </div>
          )}

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <div ref={endRef} />
        </div>

        {!done && (
          <div className="sticky bottom-0 mt-4 flex items-end gap-2 border-t border-ink/10 bg-cream pb-4 pt-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              rows={2}
              placeholder="Type your answer…"
              className="min-h-[48px] flex-1 resize-none rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-ink/40"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink text-cream disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
