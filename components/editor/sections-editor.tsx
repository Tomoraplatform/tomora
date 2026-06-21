"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, UploadCloud, Loader2, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { uploadImage, uploadMedia } from "@/lib/upload";
import type { CustomSection, CustomSectionType, CustomSectionCard, CustomSectionProduct } from "@/lib/database.types";

const SECTION_TYPES: { type: CustomSectionType; label: string; hint: string }[] = [
  { type: "text", label: "Text", hint: "Headline + description" },
  { type: "image_text", label: "Image + Text", hint: "Image and text side by side" },
  { type: "image_overlay", label: "Image background", hint: "Background image with text on top" },
  { type: "cards", label: "Cards", hint: "A grid of cards" },
  { type: "products", label: "Products", hint: "Products with pricing" },
  { type: "button", label: "Button", hint: "A call-to-action button" },
  { type: "video", label: "Video", hint: "An uploaded video (max 10MB)" },
  { type: "video_text", label: "Video + Text", hint: "Video and text side by side" },
  { type: "video_bg", label: "Video background", hint: "Video as background with text" },
];

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function newSection(type: CustomSectionType): CustomSection {
  const base: CustomSection = { id: uid("sec"), type, align: "left" };
  switch (type) {
    case "text": return { ...base, headline: "Your headline", body: "Add your text here." };
    case "image_text": return { ...base, headline: "Headline", body: "Describe it here.", image: "", imageSide: "left" };
    case "image_overlay": return { ...base, headline: "Headline", body: "Supporting text.", image: "" };
    case "cards": return { ...base, headline: "Section title", cards: [{ id: uid("card"), title: "Card title", body: "Card text", image: "" }] };
    case "products": return { ...base, headline: "Our products", products: [{ id: uid("prod"), name: "Product name", price: "₦0", image: "" }] };
    case "button": return { ...base, buttonText: "Click here", buttonHref: "#", align: "center" };
    case "video": return { ...base, headline: "Watch", videoUrl: "" };
    case "video_text": return { ...base, headline: "Headline", body: "Describe it here.", videoUrl: "", imageSide: "left" };
    case "video_bg": return { ...base, headline: "Headline", body: "Supporting text.", videoUrl: "" };
    default: return base;
  }
}

export function SectionsEditor({
  sections, onChange,
}: {
  sections: CustomSection[];
  onChange: (next: CustomSection[]) => void;
}) {
  const [adding, setAdding] = useState(false);

  const update = (i: number, patch: Partial<CustomSection>) =>
    onChange(sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) => onChange(sections.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (type: CustomSectionType) => { onChange([...sections, newSection(type)]); setAdding(false); };

  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div key={s.id} className="rounded-lg border border-ink/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink/70">
              {SECTION_TYPES.find((t) => t.type === s.type)?.label || s.type}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-ink/40 hover:text-ink disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="text-ink/40 hover:text-ink disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => remove(i)} className="text-ink/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <SectionFields section={s} onPatch={(p) => update(i, p)} />
        </div>
      ))}

      {adding ? (
        <div className="rounded-lg border border-dashed border-ink/25 p-2">
          <p className="mb-2 px-1 text-xs text-ink/50">Choose a section to add</p>
          <div className="grid grid-cols-2 gap-1.5">
            {SECTION_TYPES.map((t) => (
              <button key={t.type} onClick={() => add(t.type)} className="rounded-md border border-ink/10 px-2 py-1.5 text-left text-xs hover:bg-ink/[0.03]">
                <span className="block font-medium text-ink">{t.label}</span>
                <span className="block text-[10px] text-ink/40">{t.hint}</span>
              </button>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-1 w-full" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add section
        </Button>
      )}
    </div>
  );
}

function SectionFields({ section: s, onPatch }: { section: CustomSection; onPatch: (p: Partial<CustomSection>) => void }) {
  const hasHeadline = ["text", "image_text", "image_overlay", "cards", "products", "video", "video_text", "video_bg"].includes(s.type);
  const hasBody = ["text", "image_text", "image_overlay", "video_text", "video_bg"].includes(s.type);
  const hasButton = ["text", "image_text", "image_overlay", "button", "video_text", "video_bg"].includes(s.type);
  const hasImage = ["image_text", "image_overlay"].includes(s.type);
  const hasVideo = ["video", "video_text", "video_bg"].includes(s.type);
  const hasSide = ["image_text", "video_text"].includes(s.type);
  const hasAlign = ["text", "button"].includes(s.type);

  return (
    <div className="space-y-2">
      {hasHeadline && (
        <Field label="Headline"><Input className="h-8 text-xs" value={s.headline || ""} onChange={(e) => onPatch({ headline: e.target.value })} /></Field>
      )}
      {hasBody && (
        <Field label="Text"><Textarea rows={3} className="text-xs" value={s.body || ""} onChange={(e) => onPatch({ body: e.target.value })} /></Field>
      )}
      {hasImage && (
        <Field label="Image"><MediaUpload kind="image" value={s.image} onChange={(url) => onPatch({ image: url })} /></Field>
      )}
      {hasVideo && (
        <Field label="Video (max 10MB)"><MediaUpload kind="video" value={s.videoUrl} onChange={(url) => onPatch({ videoUrl: url })} /></Field>
      )}
      {hasSide && (
        <Field label="Layout">
          <select className="h-8 w-full rounded-md border border-ink/15 bg-white px-2 text-xs" value={s.imageSide || "left"} onChange={(e) => onPatch({ imageSide: e.target.value as "left" | "right" })}>
            <option value="left">Media on left</option>
            <option value="right">Media on right</option>
          </select>
        </Field>
      )}
      {hasAlign && (
        <Field label="Alignment">
          <select className="h-8 w-full rounded-md border border-ink/15 bg-white px-2 text-xs" value={s.align || "left"} onChange={(e) => onPatch({ align: e.target.value as "left" | "center" })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
          </select>
        </Field>
      )}
      {s.type === "cards" && <CardsEditor cards={s.cards || []} onChange={(cards) => onPatch({ cards })} />}
      {s.type === "products" && <ProductsEditor products={s.products || []} onChange={(products) => onPatch({ products })} />}
      {hasButton && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Button text"><Input className="h-8 text-xs" value={s.buttonText || ""} onChange={(e) => onPatch({ buttonText: e.target.value })} /></Field>
          <Field label="Button link"><Input className="h-8 text-xs" value={s.buttonHref || ""} onChange={(e) => onPatch({ buttonHref: e.target.value })} placeholder="# or https://" /></Field>
        </div>
      )}
    </div>
  );
}

function CardsEditor({ cards, onChange }: { cards: CustomSectionCard[]; onChange: (c: CustomSectionCard[]) => void }) {
  const set = (i: number, p: Partial<CustomSectionCard>) => onChange(cards.map((c, idx) => (idx === i ? { ...c, ...p } : c)));
  return (
    <div className="space-y-2 rounded-md bg-ink/[0.02] p-2">
      {cards.map((c, i) => (
        <div key={c.id} className="space-y-1.5 rounded border border-ink/10 bg-white p-2">
          <div className="flex justify-between"><span className="text-[10px] text-ink/50">Card {i + 1}</span><button onClick={() => onChange(cards.filter((_, idx) => idx !== i))} className="text-ink/40 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>
          <MediaUpload kind="image" value={c.image} onChange={(url) => set(i, { image: url })} />
          <Input className="h-8 text-xs" placeholder="Title" value={c.title} onChange={(e) => set(i, { title: e.target.value })} />
          <Textarea rows={2} className="text-xs" placeholder="Text" value={c.body || ""} onChange={(e) => set(i, { body: e.target.value })} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onChange([...cards, { id: uid("card"), title: "Card title", body: "", image: "" }])}><Plus className="h-3.5 w-3.5" /> Add card</Button>
    </div>
  );
}

function ProductsEditor({ products, onChange }: { products: CustomSectionProduct[]; onChange: (p: CustomSectionProduct[]) => void }) {
  const set = (i: number, p: Partial<CustomSectionProduct>) => onChange(products.map((c, idx) => (idx === i ? { ...c, ...p } : c)));
  return (
    <div className="space-y-2 rounded-md bg-ink/[0.02] p-2">
      {products.map((p, i) => (
        <div key={p.id} className="space-y-1.5 rounded border border-ink/10 bg-white p-2">
          <div className="flex justify-between"><span className="text-[10px] text-ink/50">Product {i + 1}</span><button onClick={() => onChange(products.filter((_, idx) => idx !== i))} className="text-ink/40 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>
          <MediaUpload kind="image" value={p.image} onChange={(url) => set(i, { image: url })} />
          <Input className="h-8 text-xs" placeholder="Name" value={p.name} onChange={(e) => set(i, { name: e.target.value })} />
          <div className="grid grid-cols-2 gap-1.5">
            <Input className="h-8 text-xs" placeholder="Price (e.g. ₦5,000)" value={p.price || ""} onChange={(e) => set(i, { price: e.target.value })} />
            <Input className="h-8 text-xs" placeholder="Button text" value={p.buttonText || ""} onChange={(e) => set(i, { buttonText: e.target.value })} />
          </div>
          <Input className="h-8 text-xs" placeholder="Button link (# or https://)" value={p.buttonHref || ""} onChange={(e) => set(i, { buttonHref: e.target.value })} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onChange([...products, { id: uid("prod"), name: "Product name", price: "₦0", image: "" }])}><Plus className="h-3.5 w-3.5" /> Add product</Button>
    </div>
  );
}

function MediaUpload({ kind, value, onChange }: { kind: "image" | "video"; value?: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="space-y-1">
      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-ink/25 p-2 text-xs hover:bg-ink/[0.02]">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-ink text-cream">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : kind === "video" ? <Film className="h-3.5 w-3.5" /> : <UploadCloud className="h-3.5 w-3.5" />}
        </span>
        <span className="text-ink/60">{value ? `Replace ${kind}` : `Upload ${kind}`}</span>
        <input
          type="file"
          accept={kind === "video" ? "video/*" : "image/*"}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setBusy(true); setErr("");
            const res = kind === "video" ? await uploadMedia(file, "branding") : await uploadImage(file, "branding");
            setBusy(false);
            if (res.url) onChange(res.url);
            else setErr(res.error || "Upload failed.");
          }}
        />
      </label>
      {value && kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-12 w-full rounded object-cover" />
      )}
      {value && kind === "video" && <video src={value} className="h-16 w-full rounded bg-black object-contain" />}
      {err && <p className="text-[10px] text-destructive">{err}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-ink/50">{label}</Label>
      {children}
    </div>
  );
}
