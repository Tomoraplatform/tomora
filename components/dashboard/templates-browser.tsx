"use client";

import { useState } from "react";
import { Eye, Plus, Loader2, Lock, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TemplateThumb } from "@/components/templates/template-thumb";
import { SiteRenderer } from "@/components/templates";
import {
  CATALOG_CATEGORIES, catalogTemplatesByCategory, createCatalogContent, type CatalogTemplate,
} from "@/lib/catalog";
import { createAdditionalSite } from "@/app/dashboard/(panel)/templates/actions";

export function TemplatesBrowser({
  siteCount, siteLimit, planName,
}: {
  siteCount: number;
  siteLimit: number;
  planName: string;
}) {
  const [preview, setPreview] = useState<CatalogTemplate | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const atLimit = siteCount >= siteLimit;

  async function use(id: string) {
    setCreating(id);
    setError(null);
    const res = await createAdditionalSite(id);
    // On success the server action redirects; only errors return here.
    if (res && !res.ok) { setError(res.error || "Could not create site."); setCreating(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Templates</h1>
          <p className="mt-1 text-ink/60">Preview any template and spin up another website.</p>
        </div>
        <span className="rounded-full border border-ink/15 px-3 py-1 text-sm text-ink/70">
          {siteCount} of {siteLimit} site{siteLimit > 1 ? "s" : ""} used · {planName}
        </span>
      </div>

      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {atLimit && (
        <div className="flex items-center gap-2 rounded-lg bg-cream p-4 text-sm text-ink/70">
          <Lock className="h-4 w-4" /> You&apos;ve used all sites on your {planName} plan.{" "}
          <Link href="/dashboard/billing" className="font-semibold text-ink underline">Upgrade</Link> to add more.
        </div>
      )}

      {CATALOG_CATEGORIES.map((cat) => (
        <div key={cat.id}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">{cat.name}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalogTemplatesByCategory(cat.id).map((t) => (
              <div key={t.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
                <div className="border-b border-ink/5"><TemplateThumb template={t} /></div>
                <div className="p-4">
                  <h3 className="font-semibold text-ink">{t.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-ink/60">{t.blurb}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPreview(t)}><Eye className="h-4 w-4" /> Preview</Button>
                    <Button size="sm" disabled={atLimit || creating === t.id} onClick={() => use(t.id)}>
                      {creating === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Use
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-hidden p-0">
          {preview && (
            <>
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <span className="text-sm font-semibold text-ink">{preview.name} — preview</span>
                <button onClick={() => setPreview(null)}><X className="h-5 w-5 text-ink/50" /></button>
              </div>
              <div className="max-h-[78vh] overflow-y-auto">
                <SiteRenderer
                  templateId={preview.id}
                  siteData={createCatalogContent(preview.id, { businessName: "Your Brand", brandColor: preview.accent })}
                  brandColor={preview.accent}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
