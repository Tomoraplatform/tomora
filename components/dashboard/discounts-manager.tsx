"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Check, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { saveCoupons } from "@/app/dashboard/(panel)/discounts/actions";
import type { Coupon } from "@/lib/coupons";

const blank = (): Coupon => ({ id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, code: "", type: "percent", value: 10, active: true });

export function DiscountsManager({ initial }: { initial: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initial.length ? initial : []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (i: number, patch: Partial<Coupon>) => setCoupons((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => setCoupons((cs) => cs.filter((_, idx) => idx !== i));

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    const res = await saveCoupons(coupons);
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else setError(res.error || "Could not save.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Discounts &amp; Coupons</h1>
        <p className="mt-1 text-ink/60">Create codes your customers can enter at checkout for money off. Percentage or fixed amount, with optional minimum spend and expiry.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Your codes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {coupons.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-ink/15 py-10 text-center">
              <Ticket className="h-8 w-8 text-ink/30" />
              <p className="text-sm text-ink/50">No discount codes yet.</p>
            </div>
          )}

          {coupons.map((c, i) => (
            <div key={c.id} className="space-y-3 rounded-xl border border-ink/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Code {i + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-ink/60">
                    <Switch checked={c.active} onCheckedChange={(v) => set(i, { active: v })} /> {c.active ? "Active" : "Off"}
                  </label>
                  <button onClick={() => remove(i)} className="text-ink/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input value={c.code} onChange={(e) => set(i, { code: e.target.value.toUpperCase() })} placeholder="e.g. WELCOME10" className="uppercase" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <select value={c.type} onChange={(e) => set(i, { type: e.target.value as Coupon["type"] })} className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                    <option value="percent">Percentage off (%)</option>
                    <option value="fixed">Fixed amount off (₦)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{c.type === "percent" ? "Percent off" : "Amount off (₦)"}</Label>
                  <Input type="number" min={0} value={c.value} onChange={(e) => set(i, { value: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Minimum order (₦, optional)</Label>
                  <Input type="number" min={0} value={c.minOrder ?? ""} onChange={(e) => set(i, { minOrder: e.target.value ? Math.max(0, Math.round(Number(e.target.value))) : undefined })} placeholder="No minimum" />
                </div>
                <div className="space-y-1.5">
                  <Label>Expires (optional)</Label>
                  <Input type="date" value={c.expiresAt ? c.expiresAt.slice(0, 10) : ""} onChange={(e) => set(i, { expiresAt: e.target.value || undefined })} />
                </div>
              </div>
              <p className="text-xs text-ink/50">
                {c.value > 0 ? <>Gives {c.type === "percent" ? `${c.value}% off` : `${formatNaira(c.value)} off`}{c.minOrder ? ` on orders over ${formatNaira(c.minOrder)}` : ""}.</> : "Set a value above 0."}
              </p>
            </div>
          ))}

          <Button variant="outline" onClick={() => setCoupons((cs) => [...cs, blank()])}><Plus className="h-4 w-4" /> Add code</Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
        {saving ? "Saving…" : saved ? "Saved" : "Save codes"}
      </Button>
    </div>
  );
}
