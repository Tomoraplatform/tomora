"use client";

import { useState } from "react";
import { Eye, Plus, Loader2, Lock, X, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TemplatePreview } from "@/components/marketing/template-preview";
import { SiteRenderer } from "@/components/templates";
import {
  CATALOG_CATEGORIES, catalogTemplatesByCategory, createCatalogContent, type CatalogTemplate,
} from "@/lib/catalog";
import { createAdditionalSite, editSite, deleteSite } from "@/app/dashboard/(panel)/templates/actions";

export interface MySite {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  accent: string;
  isLive: boolean;
  isCurrent: boolean;
}

export function TemplatesBrowser({
  siteCount, siteLimit, planName, mySites = [], overrides = {}, usedTemplateIds = [],
}: {
  siteCount: number;
  siteLimit: number;
  planName: string;
  mySites?: MySite[];
  overrides?: Record<string, { displayName?: string; archived?: boolean; removed?: boolean }>;
  usedTemplateIds?: string[];
}) {
  // Hide archived/removed templates from the picker, but keep any the user
  // already has a site on (their "published" one) so they can re-use it.
  const templatesFor = (catId: string) =>
    catalogTemplatesByCategory(catId as CatalogTemplate["category"])
      .filter((t) => usedTemplateIds.includes(t.id) || (!overrides[t.id]?.archived && !overrides[t.id]?.removed))
      .map((t) => ({ ...t, name: overrides[t.id]?.displayName || t.name }));
  const [preview, setPreview] = useState<CatalogTemplate | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const atLimit = siteCount >= siteLimit;

  async function use(id: string) {
    setCreating(id);
    setError(null);
    const res = await createAdditionalSite(id);
    // On success the server action redirects; only errors return here.
    if (res && !res.ok) { setError(res.error || "Could not create site."); setCreating(null); }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This permanently removes the website and its content. This cannot be undone.`)) return;
    setBusy(id); setError(null);
    const res = await deleteSite(id);
    setBusy(null);
    if (res.ok) window.location.reload();
    else setError(res.error || "Could not delete site.");
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

      {/* The user's own websites */}
      {mySites.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
            Your websites ({mySites.length} of {siteLimit})
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mySites.map((s) => (
              <div key={s.id} className="overflow-hidden rounded-2xl border-2 border-ink/10 bg-white">
                <div className="relative h-48 overflow-hidden border-b border-ink/5">
                  <TemplatePreview templateId={s.templateId} brandColor={s.accent} businessName={s.name} />
                  {s.isCurrent && (
                    <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-xs font-medium text-cream">
                      <CheckCircle2 className="h-3 w-3" /> Editing
                    </span>
                  )}
                  <span className={`absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-medium ${s.isLive ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink/60"}`}>
                    {s.isLive ? "Live" : "Draft"}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="truncate font-semibold text-ink">{s.name}</h3>
                  <p className="mt-1 text-sm text-ink/50">{s.templateName}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" disabled={busy === s.id} onClick={() => editSite(s.id)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" disabled={busy === s.id} onClick={() => remove(s.id, s.name)}>
                      {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-ink/10 pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Add another website</h2>
        <p className="mt-1 text-sm text-ink/50">
          {atLimit ? "You've reached your plan limit — delete one above to add a different template." : "Pick a template to spin up another website."}
        </p>
      </div>

      {CATALOG_CATEGORIES.map((cat) => {
        const catTemplates = templatesFor(cat.id);
        if (catTemplates.length === 0) return null;
        return (
        <div key={cat.id}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">{cat.name}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catTemplates.map((t) => (
              <div key={t.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
                <div className="h-48 overflow-hidden border-b border-ink/5">
                  <TemplatePreview templateId={t.id} brandColor={t.accent} businessName={t.name} />
                </div>
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
        );
      })}

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
