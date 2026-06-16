"use client";

import { useState } from "react";
import { Loader2, Check, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadImage } from "@/lib/upload";
import { updateBrand, type BrandInput } from "@/app/dashboard/(panel)/brand/actions";
import { cn } from "@/lib/utils";

const PRESET = ["#022245", "#0f9d76", "#c75b39", "#7c5cff", "#d4a23a", "#2563eb", "#db2777", "#111111"];

export function BrandForm({ initial }: { initial: BrandInput }) {
  const [form, setForm] = useState<BrandInput>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof BrandInput, v: any) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };
  const setSocial = (k: string, v: string) => { setForm((f) => ({ ...f, social: { ...f.social, [k]: v } })); setSaved(false); };

  async function onLogo(file?: File) {
    if (!file) return;
    setUploading(true);
    const { url } = await uploadImage(file, "branding");
    setUploading(false);
    if (url) set("logoUrl", url);
  }

  async function submit() {
    setSaving(true); setError(null);
    const res = await updateBrand(form);
    setSaving(false);
    if (res.ok) setSaved(true); else setError(res.error || "Could not save.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Brand Settings</h1>
        <p className="mt-1 text-ink/60">These details apply across your whole site.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Business name</Label><Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} /></div>
          <div className="space-y-2"><Label>Tagline</Label><Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Brand color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET.map((c) => (
                <button key={c} onClick={() => set("brandColor", c)} className={cn("h-8 w-8 rounded-full", form.brandColor.toLowerCase() === c.toLowerCase() && "ring-2 ring-ink ring-offset-2")} style={{ background: c }} />
              ))}
              <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-ink/20">
                <input type="color" value={form.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="absolute -inset-2 h-12 w-12 cursor-pointer" />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink/25 p-4 hover:bg-ink/[0.02]">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="" className="h-12 w-12 rounded object-contain" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded bg-ink text-cream">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                </span>
              )}
              <span className="text-sm text-ink/60">{form.logoUrl ? "Click to replace logo" : "Upload your logo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Address</Label><Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Social links</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Instagram</Label><Input value={form.social.instagram || ""} onChange={(e) => setSocial("instagram", e.target.value)} /></div>
          <div className="space-y-2"><Label>Twitter</Label><Input value={form.social.twitter || ""} onChange={(e) => setSocial("twitter", e.target.value)} /></div>
          <div className="space-y-2"><Label>Facebook</Label><Input value={form.social.facebook || ""} onChange={(e) => setSocial("facebook", e.target.value)} /></div>
          <div className="space-y-2"><Label>Website</Label><Input value={form.social.website || ""} onChange={(e) => setSocial("website", e.target.value)} /></div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
        {saved ? "Saved" : "Save Changes"}
      </Button>
    </div>
  );
}
