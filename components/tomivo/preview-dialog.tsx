"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Copy, Check, Lock, X, ExternalLink } from "lucide-react";
import { DesignPreview } from "@/components/tomivo/design-preview";
import type { TomivoDesignCard } from "@/lib/tomivo/db";

type Code = { promptText: string; htmlCode: string; cssCode: string };
type Tab = "prompt" | "html" | "css";

export function PreviewDialog({
  design, onClose, onLockedSubscribe,
}: {
  design: TomivoDesignCard;
  onClose: () => void;
  onLockedSubscribe: () => void;
}) {
  const [code, setCode] = useState<Code | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "locked" | "error">("loading");
  const [tab, setTab] = useState<Tab>("prompt");
  const [copied, setCopied] = useState<Tab | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/tomivo/design/${design.id}`, { cache: "no-store" });
      if (res.status === 403) { setState("locked"); return; }
      if (!res.ok) throw new Error();
      setCode(await res.json());
      setState("ready");
    } catch { setState("error"); }
  }, [design.id]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy(which: Tab) {
    if (!code) return;
    const text = which === "prompt" ? code.promptText : which === "html" ? code.htmlCode : code.cssCode;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1600);
      fetch(`/api/tomivo/design/${design.id}`, { method: "POST" }).catch(() => {});
    } catch { /* clipboard blocked */ }
  }

  const activeText = code ? (tab === "prompt" ? code.promptText : tab === "html" ? code.htmlCode : code.cssCode) : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div
        className="relative my-2 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e13] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-white">{design.title}</h2>
            <p className="truncate text-xs text-white/45">{design.description}</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live interactive preview */}
        <div className="aspect-[16/9] w-full border-b border-white/10 bg-black">
          <DesignPreview html={design.preview_html} interactive className="h-full w-full" />
        </div>

        {/* Code panel */}
        <div className="p-4 sm:p-5">
          {state === "loading" && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/50"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-white/60">Could not load this design.</p>
              <button onClick={load} className="rounded-md bg-white/10 px-4 py-2 text-xs font-semibold text-white">Try again</button>
            </div>
          )}

          {state === "locked" && (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-300"><Lock className="h-6 w-6" /></span>
              <div>
                <p className="text-base font-bold text-white">This is a Pro design</p>
                <p className="mt-1 text-sm text-white/55">Subscribe to copy the prompt, HTML and CSS of every Pro design. Previews stay free.</p>
              </div>
              <button onClick={onLockedSubscribe} className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-bold text-[#101319] hover:bg-amber-300">
                See plans & subscribe
              </button>
            </div>
          )}

          {state === "ready" && code && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1 rounded-lg bg-white/5 p-1">
                  {(["prompt", "html", "css"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition ${tab === t ? "bg-white text-[#101319]" : "text-white/60 hover:text-white"}`}
                    >
                      {t === "css" ? "CSS" : t === "html" ? "HTML" : "Prompt"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => copy(tab)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-[#04231a] hover:bg-emerald-400"
                >
                  {copied === tab ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy {tab === "css" ? "CSS" : tab === "html" ? "HTML" : "prompt"}</>}
                </button>
              </div>
              <pre className="mt-3 max-h-[38vh] overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs leading-relaxed text-white/80">
                <code className="whitespace-pre-wrap break-words">{activeText || "—"}</code>
              </pre>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-white/35">
                <ExternalLink className="h-3 w-3" /> Paste into ChatGPT, your code editor, or any website builder.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
