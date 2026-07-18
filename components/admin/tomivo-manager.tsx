"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { createDesign, updateDesign, deleteDesign } from "@/app/admin/tomivo/actions";
import { DesignPreview } from "@/components/tomivo/design-preview";
import type { TomivoDesign } from "@/lib/tomivo/db";

const CATEGORIES = ["landing-page", "animated-background", "gradient"];

export function TomivoManager({ designs }: { designs: TomivoDesign[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(designs[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (!res.ok) { window.alert(res.error || "Something went wrong."); return false; }
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => run("new", async () => { const r = await createDesign(); if (r.ok && r.id) setOpenId(r.id); return r; })}
        disabled={busy === "new"}
      >
        {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} New design
      </Button>

      {designs.length === 0 && <p className="text-sm text-ink/50">No designs yet. Create your first one.</p>}

      {designs.map((d) => (
        <DesignRow key={d.id} design={d} open={openId === d.id} onToggle={() => setOpenId(openId === d.id ? null : d.id)} run={run} busy={busy} />
      ))}
    </div>
  );
}

function DesignRow({
  design, open, onToggle, run, busy,
}: {
  design: TomivoDesign;
  open: boolean;
  onToggle: () => void;
  run: (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;
  busy: string | null;
}) {
  const [f, setF] = useState({
    title: design.title, slug: design.slug, description: design.description, category: design.category,
    tags: design.tags, prompt_text: design.prompt_text, html_code: design.html_code, css_code: design.css_code,
    preview_html: design.preview_html, thumbnail_color: design.thumbnail_color,
  });
  const save = (patch: Partial<typeof f>) => updateDesign(design.id, patch);

  return (
    <Card>
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
          {open ? <ChevronDown className="h-4 w-4 text-ink/40" /> : <ChevronRight className="h-4 w-4 text-ink/40" />}
          <span className="flex h-11 w-16 items-center justify-center overflow-hidden rounded-md" style={{ background: f.thumbnail_color }}>
            {f.preview_html
              ? <div className="pointer-events-none h-full w-full"><DesignPreview html={f.preview_html} scale={0.12} /></div>
              : null}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{f.title}</span>
            <span className="text-xs text-ink/50">{f.category}</span>
          </span>
        </button>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${design.is_premium ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
          {design.is_premium ? "Pro" : "Free"}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${design.is_published ? "bg-ink/10 text-ink/70" : "bg-ink/5 text-ink/40"}`}>
          {design.is_published ? "Published" : "Draft"}
        </span>
      </div>

      {open && (
        <CardContent className="space-y-5 border-t border-ink/10 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} onBlur={() => save({ title: f.title })} /></Field>
            <Field label="URL slug"><Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} onBlur={() => save({ slug: f.slug })} /></Field>
            <Field label="Category">
              <select className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm" value={f.category} onChange={(e) => { setF({ ...f, category: e.target.value }); updateDesign(design.id, { category: e.target.value }); }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Card background colour"><Input value={f.thumbnail_color} onChange={(e) => setF({ ...f, thumbnail_color: e.target.value })} onBlur={() => save({ thumbnail_color: f.thumbnail_color })} /></Field>
          </div>
          <Field label="Description"><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} onBlur={() => save({ description: f.description })} /></Field>
          <Field label="Tags (comma-separated)"><Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} onBlur={() => save({ tags: f.tags })} /></Field>

          <Field label="Preview HTML (self-contained, shown in the sandboxed iframe)">
            <Textarea rows={4} className="font-mono text-xs" value={f.preview_html} onChange={(e) => setF({ ...f, preview_html: e.target.value })} onBlur={() => save({ preview_html: f.preview_html })} />
          </Field>
          <Field label="Prompt (copied by subscribers)">
            <Textarea rows={4} className="font-mono text-xs" value={f.prompt_text} onChange={(e) => setF({ ...f, prompt_text: e.target.value })} onBlur={() => save({ prompt_text: f.prompt_text })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="HTML code"><Textarea rows={4} className="font-mono text-xs" value={f.html_code} onChange={(e) => setF({ ...f, html_code: e.target.value })} onBlur={() => save({ html_code: f.html_code })} /></Field>
            <Field label="CSS code"><Textarea rows={4} className="font-mono text-xs" value={f.css_code} onChange={(e) => setF({ ...f, css_code: e.target.value })} onBlur={() => save({ css_code: f.css_code })} /></Field>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t border-ink/10 pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <Switch checked={design.is_premium} onCheckedChange={(v) => run(`prem-${design.id}`, () => updateDesign(design.id, { is_premium: v }))} /> Pro (paid)
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <Switch checked={design.is_featured} onCheckedChange={(v) => run(`feat-${design.id}`, () => updateDesign(design.id, { is_featured: v }))} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <Switch checked={design.is_published} onCheckedChange={(v) => run(`pub-${design.id}`, () => updateDesign(design.id, { is_published: v }))} />
              {design.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} Published
            </label>
            <div className="ml-auto">
              <Button variant="outline" size="sm" className="text-destructive"
                onClick={() => { if (window.confirm(`Delete "${f.title}"?`)) run(`del-${design.id}`, () => deleteDesign(design.id)); }}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-xs font-medium text-ink/60">{label}</label>{children}</div>;
}
