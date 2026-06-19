"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Save, ExternalLink, Loader2, Check, Palette, UploadCloud,
  ChevronDown, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SiteRenderer } from "@/components/templates";
import { BLOCK_LABELS, supportedBlocks, type BlockType } from "@/lib/site-data";
import { uploadImage } from "@/lib/upload";
import { saveSite } from "@/app/dashboard/editor/actions";
import { cn } from "@/lib/utils";
import type { Site, SiteData } from "@/lib/database.types";

const PRESET_COLORS = ["#022245", "#0f9d76", "#c75b39", "#7c5cff", "#d4a23a", "#2563eb", "#db2777", "#111111"];

export function EditorClient({ site, liveUrl }: { site: Site; liveUrl: string }) {
  const [data, setData] = useState<SiteData>(() => ({
    ...site.site_data,
    blocks: site.site_data.blocks ?? [],
    brandColor: site.site_data.brandColor || "#022245",
    businessName: site.site_data.businessName || "",
  }));
  const [live, setLive] = useState(site.is_live);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const dirty = () => setSaved(false);

  const update = useCallback((blockId: string, field: string, value: string) => {
    setData((d) => ({
      ...d,
      blocks: d.blocks.map((b) => b.id === blockId ? { ...b, content: { ...b.content, [field]: value } } : b),
    }));
    dirty();
  }, []);

  const updateItem = (blockId: string, idx: number, field: string, value: string) => {
    setData((d) => ({
      ...d,
      blocks: d.blocks.map((b) => {
        if (b.id !== blockId) return b;
        const items = [...((b.content.items as any[]) || [])];
        items[idx] = { ...items[idx], [field]: value };
        return { ...b, content: { ...b.content, items } };
      }),
    }));
    dirty();
  };

  const toggleBlock = (type: BlockType, enabled: boolean) => {
    setData((d) => {
      const exists = d.blocks.find((b) => b.type === type);
      if (exists) {
        return { ...d, blocks: d.blocks.map((b) => b.type === type ? { ...b, enabled } : b) };
      }
      // add a fresh block in template order
      return { ...d, blocks: [...d.blocks, { id: type, type, enabled, content: {} }] };
    });
    dirty();
  };

  const setBrandColor = (c: string) => { setData((d) => ({ ...d, brandColor: c })); dirty(); };
  const setField = (field: "businessName" | "tagline" | "phone" | "email" | "address", v: string) => {
    setData((d) => ({ ...d, [field]: v })); dirty();
  };

  async function onLogo(file?: File) {
    if (!file) return;
    setUploading(true);
    const { url } = await uploadImage(file, "branding");
    setUploading(false);
    if (url) { setData((d) => ({ ...d, logoUrl: url })); dirty(); }
  }

  async function save() {
    setSaving(true);
    const res = await saveSite(site.id, data, live);
    setSaving(false);
    if (res.ok) { setSaved(true); }
  }

  const editApi = useMemo(() => ({ editing: true, update }), [update]);
  const blockMap = useMemo(() => Object.fromEntries(data.blocks.map((b) => [b.type, b])), [data.blocks]);
  const allTypes = supportedBlocks(site.template_id);

  return (
    <div className="flex h-screen flex-col bg-cream">
      {/* Top bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard"><Logo withWordmark={false} /></Link>
          <span className="hidden text-sm font-medium text-ink/70 sm:inline">Site Editor</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand color */}
          <label className="relative flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-ink/15 px-2 text-xs text-ink/70">
            <Palette className="h-4 w-4" />
            <span className="h-4 w-4 rounded-full border" style={{ background: data.brandColor }} />
            <input type="color" value={data.brandColor} onChange={(e) => setBrandColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          {/* Logo */}
          <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-ink/15 px-3 text-xs text-ink/70 hover:bg-ink/5">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
          </label>
          {/* Publish toggle */}
          <div className="flex h-9 items-center gap-2 rounded-md border border-ink/15 px-3">
            <span className="text-xs text-ink/70">{live ? "Published" : "Offline"}</span>
            <Switch checked={live} onCheckedChange={(v) => { setLive(v); dirty(); }} />
          </div>
          <Button asChild variant="outline" size="sm"><a href="/dashboard/preview" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Preview</a></Button>
          <Button asChild variant="ghost" size="sm"><a href={liveUrl} target="_blank" rel="noreferrer">View Live</a></Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left panel */}
        <aside className="w-full shrink-0 overflow-y-auto border-b border-ink/10 bg-white p-4 lg:w-80 lg:border-b-0 lg:border-r">
          <Section title="Brand">
            <FieldRow label="Business name"><Input value={data.businessName} onChange={(e) => setField("businessName", e.target.value)} /></FieldRow>
            <FieldRow label="Tagline"><Input value={data.tagline || ""} onChange={(e) => setField("tagline", e.target.value)} /></FieldRow>
          </Section>

          <Section title="Contact details">
            <FieldRow label="Phone"><Input value={data.phone || ""} onChange={(e) => setField("phone", e.target.value)} /></FieldRow>
            <FieldRow label="Email"><Input value={data.email || ""} onChange={(e) => setField("email", e.target.value)} /></FieldRow>
            <FieldRow label="Address"><Input value={data.address || ""} onChange={(e) => setField("address", e.target.value)} /></FieldRow>
          </Section>

          <Section title="Brand color">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => setBrandColor(c)}
                  className={cn("h-8 w-8 rounded-full", data.brandColor.toLowerCase() === c.toLowerCase() && "ring-2 ring-ink ring-offset-2")}
                  style={{ background: c }} aria-label={c} />
              ))}
            </div>
          </Section>

          <Section title="Sections">
            <p className="mb-2 text-xs text-ink/50">Toggle sections on or off. Click text in the preview to edit it.</p>
            <div className="space-y-2">
              {allTypes.map((type) => {
                const block = blockMap[type];
                const enabled = !!block?.enabled;
                return (
                  <BlockEditor
                    key={type}
                    type={type}
                    enabled={enabled}
                    block={block}
                    onToggle={(v) => toggleBlock(type, v)}
                    onItem={(idx, field, value) => updateItem(type, idx, field, value)}
                  />
                );
              })}
            </div>
          </Section>
        </aside>

        {/* Preview */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-200 p-3 sm:p-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-ink/10 bg-white shadow-xl">
            <SiteRenderer templateId={site.template_id} siteData={data} brandColor={data.brandColor} editApi={editApi} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-ink/60">{label}</Label>
      {children}
    </div>
  );
}

function BlockEditor({
  type, enabled, block, onToggle, onItem,
}: {
  type: BlockType;
  enabled: boolean;
  block: any;
  onToggle: (v: boolean) => void;
  onItem: (idx: number, field: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const items: any[] = block?.content?.items || [];
  const hasItems = ["stats", "services", "testimonials"].includes(type);

  return (
    <div className="rounded-lg border border-ink/10">
      <div className="flex items-center justify-between px-3 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm font-medium text-ink">
          {enabled ? <Eye className="h-4 w-4 text-ink/50" /> : <EyeOff className="h-4 w-4 text-ink/30" />}
          {BLOCK_LABELS[type]}
          {hasItems && enabled && <ChevronDown className={cn("h-4 w-4 text-ink/40 transition-transform", open && "rotate-180")} />}
        </button>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {open && enabled && hasItems && (
        <div className="space-y-3 border-t border-ink/10 p-3">
          {items.map((item, idx) => (
            <div key={idx} className="space-y-1.5 rounded-md bg-cream/60 p-2">
              {type === "stats" && (
                <>
                  <Input className="h-8 text-xs" value={item.value || ""} onChange={(e) => onItem(idx, "value", e.target.value)} placeholder="Value" />
                  <Input className="h-8 text-xs" value={item.label || ""} onChange={(e) => onItem(idx, "label", e.target.value)} placeholder="Label" />
                </>
              )}
              {type === "services" && (
                <>
                  <Input className="h-8 text-xs" value={item.title || ""} onChange={(e) => onItem(idx, "title", e.target.value)} placeholder="Title" />
                  <Input className="h-8 text-xs" value={item.description || ""} onChange={(e) => onItem(idx, "description", e.target.value)} placeholder="Description" />
                </>
              )}
              {type === "testimonials" && (
                <>
                  <Input className="h-8 text-xs" value={item.name || ""} onChange={(e) => onItem(idx, "name", e.target.value)} placeholder="Name" />
                  <Input className="h-8 text-xs" value={item.quote || ""} onChange={(e) => onItem(idx, "quote", e.target.value)} placeholder="Quote" />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
