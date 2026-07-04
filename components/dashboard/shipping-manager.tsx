"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Check, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { saveShipping } from "@/app/dashboard/(panel)/shipping/actions";

type Zone = { id: string; name: string; fee: number };
const blank = (): Zone => ({ id: `z-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: "", fee: 0 });

export function ShippingManager({ initial }: { initial: Zone[] }) {
  const [zones, setZones] = useState<Zone[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (i: number, patch: Partial<Zone>) => setZones((zs) => zs.map((z, idx) => (idx === i ? { ...z, ...patch } : z)));
  const remove = (i: number) => setZones((zs) => zs.filter((_, idx) => idx !== i));

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    const res = await saveShipping(zones);
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else setError(res.error || "Could not save.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Shipping</h1>
        <p className="mt-1 text-ink/60">Add the locations you deliver to and the fee for each. Customers pick their location at checkout and the fee is added to their total.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Delivery locations &amp; fees</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {zones.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-ink/15 py-10 text-center">
              <Truck className="h-8 w-8 text-ink/30" />
              <p className="text-sm text-ink/50">No shipping locations yet. Add your first below.</p>
            </div>
          )}
          {zones.map((z, i) => (
            <div key={z.id} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                {i === 0 && <Label>Location</Label>}
                <Input value={z.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="e.g. Lagos (Mainland)" />
              </div>
              <div className="w-36 space-y-1.5">
                {i === 0 && <Label>Fee (₦)</Label>}
                <Input type="number" min={0} value={z.fee} onChange={(e) => set(i, { fee: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
              </div>
              <button onClick={() => remove(i)} className="mb-2.5 text-ink/40 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <Button variant="outline" onClick={() => setZones((zs) => [...zs, blank()])}><Plus className="h-4 w-4" /> Add location</Button>
          <p className="text-xs text-ink/50">Tip: set a fee of 0 for free delivery to a location (e.g. &ldquo;Pickup&rdquo;).</p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
        {saving ? "Saving…" : saved ? "Saved" : "Save shipping"}
      </Button>
    </div>
  );
}
