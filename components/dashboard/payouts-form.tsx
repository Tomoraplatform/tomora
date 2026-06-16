"use client";

import { useState } from "react";
import { Loader2, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { savePayoutSettings } from "@/app/dashboard/store-actions";

export function PayoutsForm({ initial }: {
  initial: { paystackPublicKey: string; bankName: string; accountNumber: string; accountName: string };
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  async function submit() {
    setSaving(true); setError(null);
    const res = await savePayoutSettings(form);
    setSaving(false);
    if (res.ok) setSaved(true); else setError(res.error || "Could not save.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Payouts</h1>
        <p className="mt-1 text-ink/60">Connect Paystack to receive store payments directly.</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-cream p-4 text-sm text-ink/70">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Storefront payments are processed with your own Paystack public key, so funds settle straight into your Paystack
          account and on to your bank. Find your public key in your Paystack dashboard under Settings → API Keys.
        </span>
      </div>

      <Card>
        <CardHeader><CardTitle>Paystack</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Paystack public key</Label>
            <Input value={form.paystackPublicKey} onChange={(e) => set("paystackPublicKey", e.target.value)} placeholder="pk_live_..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bank account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Bank name</Label><Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="GTBank" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Account number</Label><Input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} placeholder="0123456789" /></div>
            <div className="space-y-2"><Label>Account name</Label><Input value={form.accountName} onChange={(e) => set("accountName", e.target.value)} placeholder="Ada Styles Ltd" /></div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
        {saved ? "Saved" : "Save Payout Settings"}
      </Button>
    </div>
  );
}
