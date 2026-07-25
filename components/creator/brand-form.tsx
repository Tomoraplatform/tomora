"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, UploadCloud, Palette, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { saveCreatorBrand } from "@/app/academy/sell/actions";
import { uploadCreatorImage } from "@/lib/creator/client-upload";

/** Sensible starting pairs so creators aren't picking from nothing. */
const PRESETS: { name: string; a: string; b: string }[] = [
  { name: "Midnight", a: "#242B3D", b: "#F3E969" },
  { name: "Tomora", a: "#022245", b: "#10B981" },
  { name: "Berry", a: "#2B1B44", b: "#F472B6" },
  { name: "Clay", a: "#3B2A22", b: "#E8A33D" },
  { name: "Forest", a: "#12291F", b: "#8FD694" },
];

/**
 * The creator's brand: name, logo and the two colours that drive every one of
 * their sales pages. Colour one paints the dark sections, colour two the
 * buttons and accents.
 */
export function BrandForm({ initial }: {
  initial: { brandName: string; logoUrl: string; brandColor: string; brandColor2: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  async function onLogo(file?: File) {
    if (!file) return;
    setUploading(true); setError(null);
    const { url, error: e } = await uploadCreatorImage(file, "logo");
    setUploading(false);
    if (e) { setError(e); return; }
    if (url) set("logoUrl", url);
  }

  async function submit() {
    setBusy(true); setError(null);
    const res = await saveCreatorBrand(form);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Could not save."); return; }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <p className="text-sm text-ink/60">
          These apply to every sales page you publish. Colour one paints the dark sections, colour two the buttons.
        </p>

        <div className="space-y-2">
          <Label>Brand name</Label>
          <Input value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="Shown top-left if you have no logo" />
        </div>

        <div className="space-y-2">
          <Label>Logo</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink/25 p-4 hover:bg-ink/[0.02]">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoUrl} alt="" className="h-12 w-24 rounded object-contain" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded bg-ink text-cream">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              </span>
            )}
            <span className="text-sm text-ink/60">{form.logoUrl ? "Click to replace your logo" : "Upload your logo (optional)"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
          </label>
          {form.logoUrl && (
            <button type="button" onClick={() => set("logoUrl", "")} className="text-xs text-ink/50 underline hover:text-ink">Remove logo</button>
          )}
        </div>

        <div className="space-y-3">
          <Label className="inline-flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Your two brand colours</Label>

          <div className="flex flex-wrap gap-5">
            <div className="space-y-1.5">
              <span className="block text-xs text-ink/55">Colour 1 (sections)</span>
              <div className="flex items-center gap-2">
                <input type="color" value={form.brandColor} onChange={(e) => set("brandColor", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-ink/15" />
                <Input value={form.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="w-28 font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs text-ink/55">Colour 2 (buttons)</span>
              <div className="flex items-center gap-2">
                <input type="color" value={form.brandColor2} onChange={(e) => set("brandColor2", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-ink/15" />
                <Input value={form.brandColor2} onChange={(e) => set("brandColor2", e.target.value)} className="w-28 font-mono text-xs" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} type="button"
                onClick={() => { setForm((f) => ({ ...f, brandColor: p.a, brandColor2: p.b })); setSaved(false); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/70 hover:bg-ink/5">
                <span className="flex">
                  <span className="h-3.5 w-3.5 rounded-l-full" style={{ background: p.a }} />
                  <span className="h-3.5 w-3.5 rounded-r-full" style={{ background: p.b }} />
                </span>
                {p.name}
              </button>
            ))}
          </div>

          {/* Live swatch so they can see the pairing before saving. */}
          <div className="overflow-hidden rounded-lg border border-ink/10">
            <div className="flex items-center justify-between gap-3 px-4 py-5" style={{ background: form.brandColor }}>
              <span className="text-sm font-semibold" style={{ color: readableOn(form.brandColor) }}>Your sales page</span>
              <span className="rounded-md px-3.5 py-1.5 text-xs font-bold" style={{ background: form.brandColor2, color: readableOn(form.brandColor2) }}>
                Get Access
              </span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
          {saved ? "Saved" : "Save brand"}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Black or white text depending on how light the background is. */
function readableOn(hex: string): string {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000000" : "#ffffff";
}
