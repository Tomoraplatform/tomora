"use client";

import { useState } from "react";
import { Plus, Trash2, UploadCloud, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";
import type { SiteData, CatalogTestimonial } from "@/lib/database.types";

const PRESET = ["#022245", "#0f9d76", "#c75b39", "#7c5cff", "#d4a23a", "#2563eb", "#db2777", "#111111"];

export function CatalogEditorPanel({
  data,
  patch,
}: {
  data: SiteData;
  patch: (p: Partial<SiteData>) => void;
}) {
  const [hex, setHex] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const custom = data.brandColors || [];
  const testimonials = data.testimonials || [];
  const services = data.services || [];
  const social = data.social || {};

  async function upload(field: "logoUrl" | "heroImage", file?: File) {
    if (!file) return;
    setUploading(field);
    const { url } = await uploadImage(file, "branding");
    setUploading(null);
    if (url) patch({ [field]: url } as Partial<SiteData>);
  }

  function addHex() {
    const v = hex.trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(v)) return;
    const code = v.startsWith("#") ? v : `#${v}`;
    const next = Array.from(new Set([...custom, code])).slice(0, 3);
    patch({ brandColors: next, brandColor: code });
    setHex("");
  }

  function setTestimonial(i: number, field: keyof CatalogTestimonial, value: string) {
    const next = testimonials.map((t, idx) => (idx === i ? { ...t, [field]: value } : t));
    patch({ testimonials: next });
  }
  function addTestimonial() {
    patch({
      testimonials: [
        ...testimonials,
        { id: `t-${Date.now()}`, name: "New name", role: "Customer", quote: "Their words go here." },
      ],
    });
  }
  function removeTestimonial(i: number) {
    patch({ testimonials: testimonials.filter((_, idx) => idx !== i) });
  }

  function setService(i: number, field: "title" | "description", value: string) {
    patch({ services: services.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)) });
  }
  function addService() {
    patch({ services: [...services, { id: `s-${Date.now()}`, title: "New item", description: "Describe it here." }] });
  }
  function removeService(i: number) {
    patch({ services: services.filter((_, idx) => idx !== i) });
  }

  return (
    <div>
      <Section title="Brand">
        <FieldRow label="Business name"><Input value={data.businessName || ""} onChange={(e) => patch({ businessName: e.target.value })} /></FieldRow>
        <FieldRow label="Tagline"><Input value={data.tagline || ""} onChange={(e) => patch({ tagline: e.target.value })} /></FieldRow>
        <FieldRow label="Logo">
          <UploadRow label={data.logoUrl ? "Replace logo" : "Upload logo"} preview={data.logoUrl} busy={uploading === "logoUrl"} onFile={(f) => upload("logoUrl", f)} />
        </FieldRow>
      </Section>

      <Section title="Brand color">
        <div className="flex flex-wrap gap-2">
          {[...PRESET, ...custom].map((c) => (
            <button key={c} onClick={() => patch({ brandColor: c })}
              className={cn("h-8 w-8 rounded-full", (data.brandColor || "").toLowerCase() === c.toLowerCase() && "ring-2 ring-ink ring-offset-2")}
              style={{ background: c }} aria-label={c} />
          ))}
        </div>
        <p className="text-xs text-ink/50">Add up to 3 custom brand colors ({custom.length}/3).</p>
        {custom.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {custom.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full border border-ink/15 py-0.5 pl-1 pr-2 text-xs">
                <span className="h-4 w-4 rounded-full" style={{ background: c }} /> {c}
                <button onClick={() => patch({ brandColors: custom.filter((x) => x !== c) })}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
        {custom.length < 3 && (
          <div className="flex gap-2">
            <Input value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#1A2B3C" className="h-9" onKeyDown={(e) => e.key === "Enter" && addHex()} />
            <Button type="button" variant="outline" size="sm" onClick={addHex}>Add</Button>
          </div>
        )}
      </Section>

      <Section title="Hero">
        <FieldRow label="Headline"><Textarea rows={2} value={data.heroHeadline || ""} onChange={(e) => patch({ heroHeadline: e.target.value })} /></FieldRow>
        <FieldRow label="Subtext"><Textarea rows={2} value={data.heroSubtext || ""} onChange={(e) => patch({ heroSubtext: e.target.value })} /></FieldRow>
        <FieldRow label="Hero image">
          <UploadRow label={data.heroImage ? "Replace image" : "Upload image"} preview={data.heroImage} busy={uploading === "heroImage"} onFile={(f) => upload("heroImage", f)} />
        </FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Button text"><Input value={data.ctaText || ""} onChange={(e) => patch({ ctaText: e.target.value })} /></FieldRow>
          <FieldRow label="Button link"><Input value={data.ctaHref || ""} onChange={(e) => patch({ ctaHref: e.target.value })} placeholder="# or https://" /></FieldRow>
        </div>
      </Section>

      {services.length > 0 && (
      <Section title="Services / Features">
        <p className="mb-1 text-xs text-ink/50">The cards in your services / what-we-do section.</p>
        <div className="space-y-3">
          {services.map((s, i) => (
            <div key={s.id || i} className="space-y-2 rounded-lg border border-ink/10 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink/60">Item {i + 1}</span>
                <button onClick={() => removeService(i)} className="text-ink/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <Input className="h-8 text-xs" placeholder="Title" value={s.title} onChange={(e) => setService(i, "title", e.target.value)} />
              <Textarea rows={2} className="text-xs" placeholder="Description" value={s.description || ""} onChange={(e) => setService(i, "description", e.target.value)} />
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={addService}><Plus className="h-4 w-4" /> Add item</Button>
      </Section>
      )}

      <Section title="Testimonials">
        <p className="mb-1 text-xs text-ink/50">Add, edit or remove what people say about you.</p>
        <div className="space-y-3">
          {testimonials.map((t, i) => (
            <div key={t.id || i} className="space-y-2 rounded-lg border border-ink/10 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink/60">Testimonial {i + 1}</span>
                <button onClick={() => removeTestimonial(i)} className="text-ink/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <Input className="h-8 text-xs" placeholder="Name" value={t.name} onChange={(e) => setTestimonial(i, "name", e.target.value)} />
              <Input className="h-8 text-xs" placeholder="Role (optional)" value={t.role || ""} onChange={(e) => setTestimonial(i, "role", e.target.value)} />
              <Textarea rows={2} className="text-xs" placeholder="Quote" value={t.quote} onChange={(e) => setTestimonial(i, "quote", e.target.value)} />
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={addTestimonial}><Plus className="h-4 w-4" /> Add testimonial</Button>
      </Section>

      <Section title="Contact details">
        <FieldRow label="Phone"><Input value={data.phone || ""} onChange={(e) => patch({ phone: e.target.value })} /></FieldRow>
        <FieldRow label="Email"><Input value={data.email || ""} onChange={(e) => patch({ email: e.target.value })} /></FieldRow>
        <FieldRow label="Address"><Input value={data.address || ""} onChange={(e) => patch({ address: e.target.value })} /></FieldRow>
      </Section>

      <Section title="Social links">
        <p className="mb-1 text-xs text-ink/50">Only the ones you fill in will show on your site.</p>
        {(["instagram", "twitter", "facebook", "website"] as const).map((k) => (
          <FieldRow key={k} label={k[0].toUpperCase() + k.slice(1)}>
            <Input value={social[k] || ""} onChange={(e) => patch({ social: { ...social, [k]: e.target.value } })} placeholder={k === "website" ? "https://" : "@handle or URL"} />
          </FieldRow>
        ))}
      </Section>
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

function UploadRow({ label, preview, busy, onFile }: { label: string; preview?: string; busy: boolean; onFile: (f?: File) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink/25 p-3 hover:bg-ink/[0.02]">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-10 w-10 rounded object-cover" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded bg-ink text-cream">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
        </span>
      )}
      <span className="text-xs text-ink/60">{busy ? "Uploading…" : label}</span>
      <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
    </label>
  );
}
