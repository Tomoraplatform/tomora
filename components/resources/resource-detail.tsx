"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Copy, Download, Check, Maximize2, Loader2 } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { DesignPreview } from "@/components/tomivo/design-preview";
import { UnlockPanel } from "@/components/resources/unlock-panel";
import { categoryMeta } from "@/lib/resources/constants";
import { formatNaira } from "@/lib/utils";
import type { ResourceCard } from "@/lib/resources/db";

type CopyTarget = "prompt" | "html";

export function ResourceDetail({
  resource,
  owned,
  email,
}: {
  resource: ResourceCard;
  owned: boolean;
  email: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [busy, setBusy] = useState<CopyTarget | null>(null);
  const [error, setError] = useState("");
  const [full, setFull] = useState(false);

  const locked = resource.is_paid && !owned;
  const meta = categoryMeta(resource.category);

  // Returning from Paystack's hosted page rather than the inline popup: settle
  // the reference so the resource unlocks on this device too.
  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    if (!reference || owned) return;
    fetch("/api/resources/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.ok) router.refresh(); })
      .catch(() => {});
  }, [params, owned, router]);

  async function copy(what: CopyTarget) {
    setBusy(what);
    setError("");
    try {
      const res = await fetch(`/api/resources/${resource.slug}/content?copy=${what}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load this resource.");
      await navigator.clipboard.writeText(what === "prompt" ? data.prompt : data.html);
      setCopied(what);
      setTimeout(() => setCopied(null), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not copy. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <MarketingNav />

      <div className="container py-8 md:py-12">
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> All resources
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ---- Live preview ---------------------------------------- */}
          <div>
            <div
              className="relative overflow-hidden rounded-2xl border border-ink/10 shadow-sm"
              style={{ backgroundColor: resource.thumbnail_color }}
            >
              <div className="aspect-[16/10]">
                {resource.preview_html ? (
                  <DesignPreview html={resource.preview_html} scale={0.5} className="h-full w-full" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/60">
                    Preview coming soon
                  </div>
                )}
              </div>
              <button
                onClick={() => setFull(true)}
                className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-ink shadow-md hover:bg-white"
              >
                <Maximize2 className="h-4 w-4" /> Full preview
              </button>
            </div>
            <p className="mt-3 text-sm text-ink/50">
              This is the real resource rendering live, not a screenshot.
            </p>
          </div>

          {/* ---- Details and actions ---------------------------------- */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink/45">
              {meta.label}
            </span>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-ink">{resource.title}</h1>
            {resource.description && (
              <p className="mt-3 text-ink/60">{resource.description}</p>
            )}

            <p className="mt-5 text-2xl font-bold text-ink">
              {resource.is_paid ? formatNaira(resource.price) : "Free"}
              {resource.is_paid && (
                <span className="ml-2 text-sm font-normal text-ink/50">one off</span>
              )}
            </p>

            {locked ? (
              <UnlockPanel resource={resource} />
            ) : (
              <div className="mt-6 space-y-3">
                {resource.is_paid && (
                  <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <Check className="h-4 w-4 shrink-0" /> Unlocked. It is yours to keep.
                  </p>
                )}
                <button
                  onClick={() => copy("prompt")}
                  disabled={busy !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 font-semibold text-cream transition hover:bg-ink/90 disabled:opacity-60"
                >
                  {busy === "prompt" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : copied === "prompt" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "prompt" ? "Prompt copied" : "Copy the AI prompt"}
                </button>
                <button
                  onClick={() => copy("html")}
                  disabled={busy !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-5 py-3.5 font-semibold text-ink transition hover:border-ink/30 disabled:opacity-60"
                >
                  {busy === "html" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : copied === "html" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied === "html" ? "HTML copied" : "Copy the HTML"}
                </button>
                <a
                  href={`/api/resources/${resource.slug}/download`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-5 py-3.5 font-semibold text-ink transition hover:border-ink/30"
                >
                  <Download className="h-4 w-4" /> Download the file
                </a>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            )}

            {email && (
              <p className="mt-5 text-xs text-ink/40">Unlocked on this device as {email}</p>
            )}

            <div className="mt-8 rounded-xl border border-ink/10 bg-white p-5">
              <h2 className="text-sm font-semibold text-ink">How to use it</h2>
              <ol className="mt-3 space-y-2 text-sm text-ink/60">
                <li>1. Copy the prompt into Claude or your AI tool to build your own variation.</li>
                <li>2. Or copy the HTML straight into your project and change the copy.</li>
                <li>3. Or download the file and open it in any editor.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Full screen preview ------------------------------------- */}
      {full && (
        <div className="fixed inset-0 z-[60] bg-black/80 p-3 md:p-8" onClick={() => setFull(false)}>
          <div
            className="relative mx-auto h-full max-w-7xl overflow-hidden rounded-xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <DesignPreview html={resource.preview_html} interactive className="h-full w-full" />
            <button
              onClick={() => setFull(false)}
              className="absolute right-4 top-4 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-ink shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <MarketingFooter />
    </div>
  );
}
