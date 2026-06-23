"use client";

import { useState } from "react";
import { Plus, Trash2, UploadCloud, Loader2, X, Package, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";
import type { EditableList, SectionDef } from "@/lib/catalog";
import type { SiteData, CustomSection } from "@/lib/database.types";
import { SectionsEditor } from "./sections-editor";

const PRESET = ["#022245", "#0f9d76", "#c75b39", "#7c5cff", "#d4a23a", "#2563eb", "#db2777", "#111111"];

type Field = { key: string; label: string; type?: "text" | "textarea" | "number" | "image" };

const LIST_CONFIG: Record<EditableList, { key: keyof SiteData; title: string; fields: Field[]; make: () => any }> = {
  services: {
    key: "services", title: "Services / Features",
    fields: [{ key: "title", label: "Title" }, { key: "description", label: "Description", type: "textarea" }],
    make: () => ({ id: `s-${Date.now()}`, title: "New item", description: "Describe it here." }),
  },
  portfolio: {
    key: "portfolioItems", title: "Portfolio / Projects",
    fields: [{ key: "image", label: "Image", type: "image" }, { key: "title", label: "Title" }, { key: "category", label: "Category" }, { key: "description", label: "Description", type: "textarea" }],
    make: () => ({ id: `pf-${Date.now()}`, title: "New project", category: "Design", description: "What you built.", image: "" }),
  },
  courses: {
    key: "courses", title: "Courses",
    fields: [{ key: "image", label: "Image", type: "image" }, { key: "title", label: "Title" }, { key: "instructor", label: "Instructor" }, { key: "category", label: "Category" }, { key: "level", label: "Level" }],
    make: () => ({ id: `c-${Date.now()}`, title: "New course", instructor: "You", category: "General", level: "Beginner", image: "" }),
  },
  causes: {
    key: "causes", title: "Causes / Campaigns",
    fields: [{ key: "image", label: "Image", type: "image" }, { key: "title", label: "Title" }, { key: "description", label: "Description", type: "textarea" }, { key: "raised", label: "Raised (NGN)", type: "number" }, { key: "goal", label: "Goal (NGN)", type: "number" }],
    make: () => ({ id: `ca-${Date.now()}`, title: "New cause", description: "Why it matters.", image: "", raised: 0, goal: 100000 }),
  },
  events: {
    key: "events", title: "Events",
    fields: [{ key: "image", label: "Image", type: "image" }, { key: "title", label: "Title" }, { key: "date", label: "Date" }, { key: "location", label: "Location" }, { key: "description", label: "Description", type: "textarea" }],
    make: () => ({ id: `e-${Date.now()}`, title: "New event", date: "Sat 12 Jul", location: "Main Hall", description: "Join us.", image: "" }),
  },
  testimonials: {
    key: "testimonials", title: "Testimonials",
    fields: [{ key: "image", label: "Photo", type: "image" }, { key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "quote", label: "Quote", type: "textarea" }],
    make: () => ({ id: `t-${Date.now()}`, name: "New name", role: "Customer", quote: "Their words here.", image: "" }),
  },
  trustBadges: {
    key: "trustBadges", title: "Trust badge",
    fields: [{ key: "title", label: "Title" }, { key: "subtitle", label: "Subtitle" }],
    make: () => ({ id: `tb-${Date.now()}`, title: "New badge", subtitle: "Detail" }),
  },
  faqs: {
    key: "faqs", title: "FAQ",
    fields: [{ key: "question", label: "Question" }, { key: "answer", label: "Answer", type: "textarea" }],
    make: () => ({ id: `f-${Date.now()}`, question: "New question?", answer: "The answer." }),
  },
  stats: {
    key: "stats", title: "Stats / Numbers",
    fields: [{ key: "value", label: "Value (e.g. 120+)" }, { key: "label", label: "Label" }],
    make: () => ({ id: `st-${Date.now()}`, value: "10+", label: "Metric" }),
  },
  hours: {
    key: "hours", title: "Service / Opening Times",
    fields: [{ key: "label", label: "Day (e.g. Sunday)" }, { key: "time", label: "Time (e.g. 9:00 AM)" }],
    make: () => ({ id: `h-${Date.now()}`, label: "Sunday", time: "9:00 AM" }),
  },
  shopCategories: {
    key: "shopCategories", title: "Categories",
    fields: [{ key: "image", label: "Image", type: "image" }, { key: "name", label: "Name" }],
    make: () => ({ id: `cat-${Date.now()}`, name: "New category", image: "" }),
  },
  clientLogos: {
    key: "clientLogos", title: "Client / partner logos",
    fields: [{ key: "image", label: "Logo", type: "image" }, { key: "name", label: "Name (optional)" }],
    make: () => ({ id: `cl-${Date.now()}`, name: "Client", image: "" }),
  },
  resume: {
    key: "resume", title: "Resume (Education / Experience / Skills)",
    fields: [
      { key: "group", label: "Section (e.g. Education, Experience, Skills)" },
      { key: "title", label: "Date range or area" },
      { key: "subtitle", label: "Institution / role" },
      { key: "detail", label: "Qualification / note" },
    ],
    make: () => ({ id: `r-${Date.now()}`, group: "Education", title: "2020 - 2024", subtitle: "Institution", detail: "Qualification" }),
  },
};

export function CatalogEditorPanel({
  data,
  patch,
  lists,
  sections = [],
  reorder = [],
  isEcommerce = false,
  onManageProducts,
}: {
  data: SiteData;
  patch: (p: Partial<SiteData>) => void;
  lists: EditableList[];
  sections?: SectionDef[];
  reorder?: SectionDef[];
  isEcommerce?: boolean;
  onManageProducts?: () => void;
}) {
  // Current section order (saved order first, then any new sections).
  const orderKeys = (() => {
    const natural = reorder.map((r) => r.key);
    const saved = (data.sectionOrder || []).filter((k) => natural.includes(k));
    return [...saved, ...natural.filter((k) => !saved.includes(k))];
  })();
  const labelFor = (k: string) => reorder.find((r) => r.key === k)?.label || k;
  function moveSection(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= orderKeys.length) return;
    const next = [...orderKeys];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ sectionOrder: next });
  }
  const [hex, setHex] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const custom = data.brandColors || [];

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
    patch({ brandColors: Array.from(new Set([...custom, code])).slice(0, 3), brandColor: code });
    setHex("");
  }

  // Sections in the page's current order; each carries its own controls.
  const orderedDefs = orderKeys
    .map((k) => reorder.find((r) => r.key === k))
    .filter(Boolean) as SectionDef[];
  const headingDefault = (key?: string) =>
    (sections.find((s) => s.key === key)?.label || "").replace("{name}", data.businessName || "your brand");

  const heroFields = (
    <>
      <FieldRow label="Headline"><Textarea rows={2} value={data.heroHeadline || ""} onChange={(e) => patch({ heroHeadline: e.target.value })} /></FieldRow>
      <FieldRow label="Subtext"><Textarea rows={2} value={data.heroSubtext || ""} onChange={(e) => patch({ heroSubtext: e.target.value })} /></FieldRow>
      <FieldRow label="Image">
        <UploadRow label={data.heroImage ? "Replace image" : "Upload image"} preview={data.heroImage} busy={uploading === "heroImage"} onFile={(f) => upload("heroImage", f)} />
      </FieldRow>
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="Button text"><Input value={data.ctaText || ""} onChange={(e) => patch({ ctaText: e.target.value })} /></FieldRow>
        <FieldRow label="Button link"><Input value={data.ctaHref || ""} onChange={(e) => patch({ ctaHref: e.target.value })} placeholder="# or https://" /></FieldRow>
      </div>
    </>
  );

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
        {custom.length < 3 && (
          <div className="flex gap-2">
            <Input value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#1A2B3C" className="h-9" onKeyDown={(e) => e.key === "Enter" && addHex()} />
            <Button type="button" variant="outline" size="sm" onClick={addHex}>Add</Button>
          </div>
        )}
      </Section>

      <div className="mb-2 mt-4 border-t border-ink/10 pt-4">
        <p className="text-xs text-ink/50">Page sections — edit each one; use the arrows to reorder them on your page.</p>
      </div>

      {orderedDefs.length === 0 && (
        <SectionGroup label="Hero">{heroFields}</SectionGroup>
      )}

      {orderedDefs.map((def, i) => {
        const hkey = def.heading;
        const hasControls = def.hero || def.heading || def.text || def.list || def.image || def.formToggle || (def.products && isEcommerce);
        return (
          <SectionGroup
            key={def.key}
            label={def.label}
            onUp={reorder.length > 1 && i > 0 ? () => moveSection(i, -1) : undefined}
            onDown={reorder.length > 1 && i < orderedDefs.length - 1 ? () => moveSection(i, 1) : undefined}
          >
            {def.hero ? (
              <>
                {heroFields}
                {def.video && (
                  <FieldRow label="Owner video link (optional)">
                    <Input value={data.heroVideoUrl || ""} placeholder="https://youtu.be/…" onChange={(e) => patch({ heroVideoUrl: e.target.value })} />
                  </FieldRow>
                )}
                {def.list && <ListBody cfg={LIST_CONFIG[def.list]} data={data} patch={patch} />}
              </>
            ) : (
              <>
                {hkey && (
                  <FieldRow label="Title">
                    <Input
                      value={data.sectionTitles?.[hkey] ?? ""}
                      placeholder={headingDefault(hkey) || def.label}
                      onChange={(e) => patch({ sectionTitles: { ...(data.sectionTitles || {}), [hkey]: e.target.value } })}
                    />
                  </FieldRow>
                )}
                {def.text && hkey && (
                  <FieldRow label="Intro text">
                    <Textarea rows={2} value={data.sectionText?.[hkey] ?? ""} placeholder="Optional"
                      onChange={(e) => patch({ sectionText: { ...(data.sectionText || {}), [hkey]: e.target.value } })} />
                  </FieldRow>
                )}
                {def.image && (
                  <FieldRow label="Section image">
                    <ItemField field={{ key: "img", label: "", type: "image" }} value={data.sectionImages?.[def.key]}
                      onChange={(v) => patch({ sectionImages: { ...(data.sectionImages || {}), [def.key]: v } })} />
                  </FieldRow>
                )}
                {def.formToggle && (
                  <div className="flex items-center justify-between rounded-md border border-ink/10 px-3 py-2">
                    <span className="text-xs text-ink/70">Show signup form</span>
                    <Switch checked={data.showNewsletter !== false} onCheckedChange={(v) => patch({ showNewsletter: v })} />
                  </div>
                )}
                {def.book && (
                  <FieldRow label="Booking link (Calendly, WhatsApp, etc.)">
                    <Input value={data.bookingUrl || ""} placeholder="https://calendly.com/you"
                      onChange={(e) => patch({ bookingUrl: e.target.value })} />
                  </FieldRow>
                )}
                {def.list && (
                  <ListBody cfg={LIST_CONFIG[def.list]} data={data} patch={patch} />
                )}
                {def.products && isEcommerce && (
                  onManageProducts ? (
                    <button type="button" onClick={onManageProducts} className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-cream hover:opacity-90">
                      <Package className="h-4 w-4" /> Manage products &amp; prices
                    </button>
                  ) : (
                    <a href="/dashboard/products" className="flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-cream hover:opacity-90">
                      <Package className="h-4 w-4" /> Manage products &amp; prices
                    </a>
                  )
                )}
                {!hasControls && (
                  <p className="text-xs text-ink/40">This section&apos;s content is styled by the template. Use the arrows to move it.</p>
                )}
              </>
            )}
          </SectionGroup>
        );
      })}

      <Section title="Add sections">
        <p className="-mt-1 mb-1 text-xs text-ink/50">Add extra sections to your page — they appear above the footer.</p>
        <SectionsEditor
          sections={data.customSections || []}
          onChange={(next: CustomSection[]) => patch({ customSections: next })}
        />
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
            <Input value={data.social?.[k] || ""} onChange={(e) => patch({ social: { ...(data.social || {}), [k]: e.target.value } })} placeholder={k === "website" ? "https://" : "@handle or URL"} />
          </FieldRow>
        ))}
      </Section>
    </div>
  );
}

/** A collapsible-styled group for one page section, with reorder arrows. */
function SectionGroup({
  label, children, onUp, onDown,
}: {
  label: string;
  children: React.ReactNode;
  onUp?: () => void;
  onDown?: () => void;
}) {
  return (
    <div className="mb-4 rounded-xl border border-ink/10">
      <div className="flex items-center justify-between border-b border-ink/10 bg-cream/40 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</h3>
        {(onUp || onDown) && (
          <div className="flex items-center gap-1">
            <button onClick={onUp} disabled={!onUp} className="text-ink/40 hover:text-ink disabled:opacity-25" aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
            <button onClick={onDown} disabled={!onDown} className="text-ink/40 hover:text-ink disabled:opacity-25" aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </div>
  );
}

/** Renders an editable list's items + add button (no section wrapper). */
function ListBody({ cfg, data, patch }: {
  cfg: { key: keyof SiteData; title: string; fields: Field[]; make: () => any };
  data: SiteData;
  patch: (p: Partial<SiteData>) => void;
}) {
  const items = (data[cfg.key] as any[]) || [];
  const onChange = (next: any[]) => patch({ [cfg.key]: next } as Partial<SiteData>);
  const set = (i: number, key: string, value: any) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.id || i} className="space-y-2 rounded-lg border border-ink/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink/60">{cfg.title} {i + 1}</span>
            <button onClick={() => remove(i)} className="text-ink/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
          {cfg.fields.map((f) => (
            <ItemField key={f.key} field={f} value={item[f.key]} onChange={(v) => set(i, f.key, v)} />
          ))}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onChange([...items, cfg.make()])}><Plus className="h-4 w-4" /> Add item</Button>
    </div>
  );
}

function ItemField({ field, value, onChange }: { field: Field; value: any; onChange: (v: any) => void }) {
  const [busy, setBusy] = useState(false);
  if (field.type === "image") {
    return (
      <div className="space-y-1">
        <Label className="text-[11px] text-ink/50">{field.label}</Label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-ink/25 p-2 text-xs hover:bg-ink/[0.02]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-8 w-8 rounded object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded bg-ink text-cream">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
            </span>
          )}
          <span className="text-ink/60">{value ? "Replace image" : "Upload image"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setBusy(true); const { url } = await uploadImage(file, "branding"); setBusy(false);
            if (url) onChange(url);
          }} />
        </label>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-ink/50">{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea rows={2} className="text-xs" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input className="h-8 text-xs" type={field.type === "number" ? "number" : "text"} value={value ?? ""}
          onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)} />
      )}
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
