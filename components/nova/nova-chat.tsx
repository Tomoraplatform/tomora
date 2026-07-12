"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Loader2, ExternalLink, Pencil, CheckCircle2, ImagePlus, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

const OPENER =
  "Hi, I'm Nova. I'll build your whole website for you — just answer a few quick questions. You can also attach photos along the way (your logo, shop photos, product pictures) and I'll put them in the right places. First: what kind of website do you need, and what does your business or organisation do?";

const MAX_ATTACH = 10;

export function NovaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: OPENER }]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ liveUrl: string; subdomain: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, done, attachments]);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const files = Array.from(list).slice(0, MAX_ATTACH - attachments.length);
    if (!files.length) return;
    setUploading((n) => n + files.length);
    for (const file of files) {
      if (!file.type.startsWith("image/")) { setUploading((n) => n - 1); continue; }
      const { url, error: err } = await uploadImage(file, "products");
      setUploading((n) => n - 1);
      if (url) setAttachments((prev) => [...prev, url].slice(0, MAX_ATTACH));
      else if (err) setError(err);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send() {
    const content = input.trim();
    if ((!content && !attachments.length) || busy || done || uploading > 0) return;
    setError(null);
    setInput("");
    const images = attachments;
    setAttachments([]);
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: content || "Here are my photos.", images: images.length ? images : undefined },
    ];
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
      // Roll everything back into the composer so nothing is lost.
      setMessages(messages);
      setInput(content);
      setAttachments(images);
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
                {m.images && m.images.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {m.images.map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={src} src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
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
                Tip: open the editor any time to change photos, your logo, colours or text.
              </p>
            </div>
          )}

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <div ref={endRef} />
        </div>

        {!done && (
          <div className="sticky bottom-0 mt-4 border-t border-ink/10 bg-cream pb-4 pt-3">
            {(attachments.length > 0 || uploading > 0) && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {attachments.map((src) => (
                  <span key={src} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-14 w-14 rounded-lg border border-ink/10 object-cover" />
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((u) => u !== src))}
                      aria-label="Remove image"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-cream"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {uploading > 0 && (
                  <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-ink/20 text-ink/40">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy || attachments.length >= MAX_ATTACH}
                aria-label="Attach images"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ink/15 bg-white text-ink/60 hover:text-ink disabled:opacity-40"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
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
                disabled={busy || uploading > 0 || (!input.trim() && !attachments.length)}
                aria-label="Send"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink text-cream disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
