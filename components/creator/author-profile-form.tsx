"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveCreatorProfile, checkHandle } from "@/app/academy/sell/actions";
import { uploadCreatorImage } from "@/lib/creator/client-upload";
import { APP_DOMAIN } from "@/lib/constants";

export function AuthorProfileForm({ initial }: {
  initial?: { handle: string; authorName: string; authorBio: string; authorPhotoUrl: string; showAuthor: boolean };
}) {
  const router = useRouter();
  const isNew = !initial;
  const [form, setForm] = useState({
    handle: initial?.handle || "",
    authorName: initial?.authorName || "",
    authorBio: initial?.authorBio || "",
    authorPhotoUrl: initial?.authorPhotoUrl || "",
    showAuthor: initial?.showAuthor ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [handleState, setHandleState] = useState<{ ok?: boolean; msg?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form, v: any) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  async function verifyHandle() {
    if (!form.handle.trim()) return;
    const res = await checkHandle(form.handle);
    if (res.ok) { setHandleState({ ok: true, msg: "Available" }); if (res.handle) set("handle", res.handle); }
    else setHandleState({ ok: false, msg: res.error });
  }

  async function onPhoto(file?: File) {
    if (!file) return;
    setUploading(true);
    const { url, error: e } = await uploadCreatorImage(file, "author");
    setUploading(false);
    if (e) { setError(e); return; }
    if (url) set("authorPhotoUrl", url);
  }

  async function submit() {
    setBusy(true); setError(null);
    const res = await saveCreatorProfile(form);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Could not save."); return; }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader><CardTitle>About the author</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {isNew && (
          <div className="space-y-2">
            <Label>Your page name</Label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink/50">{APP_DOMAIN}/c/</span>
              <Input
                className="w-full sm:w-56"
                value={form.handle}
                onChange={(e) => { set("handle", e.target.value); setHandleState({}); }}
                onBlur={verifyHandle}
                placeholder="yourname"
              />
              {handleState.msg && (
                <span className={`text-xs font-medium ${handleState.ok ? "text-emerald-600" : "text-red-600"}`}>{handleState.msg}</span>
              )}
            </div>
            <p className="text-xs text-ink/50">This is your public course page address. It can&apos;t be changed later.</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Author name</Label>
          <Input value={form.authorName} onChange={(e) => set("authorName", e.target.value)} placeholder="Your full name or brand" />
        </div>

        <div className="space-y-2">
          <Label>Short bio</Label>
          <Textarea rows={3} value={form.authorBio} onChange={(e) => set("authorBio", e.target.value)} placeholder="Tell students who you are and why you can teach this." />
        </div>

        <div className="space-y-2">
          <Label>Author picture</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink/25 p-4 hover:bg-ink/[0.02]">
            {form.authorPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.authorPhotoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <User className="h-6 w-6" />}
              </span>
            )}
            <span className="text-sm text-ink/60">{form.authorPhotoUrl ? "Click to replace your picture" : "Upload your picture"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-ink/10 bg-ink/[0.02] p-4">
          <Switch checked={form.showAuthor} onCheckedChange={(v) => set("showAuthor", v)} />
          <span className="text-sm">
            <span className="font-medium text-ink">Show me on my course pages</span>
            <span className="mt-0.5 block text-ink/55">Students see your picture as an avatar and can open &ldquo;About the author&rdquo; to read your bio.</span>
          </span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={busy || !form.authorName.trim() || (isNew && handleState.ok === false)}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
          {saved ? "Saved" : isNew ? "Continue" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
