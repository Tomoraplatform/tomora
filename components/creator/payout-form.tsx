"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { saveCreatorPayout } from "@/app/academy/sell/actions";

/** Bank details creators withdraw their course earnings to. */
export function PayoutForm({ initial }: {
  initial: { bankName: string; bankCode: string; accountNumber: string; accountName: string };
}) {
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/paystack/banks")
      .then((r) => r.json())
      .then((d) => setBanks(Array.isArray(d.banks) ? d.banks : []))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  async function submit() {
    setBusy(true); setError(null);
    const res = await saveCreatorPayout(form);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Could not save."); return; }
    setSaved(true);
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-ink/60">
          Your share of every sale goes to your Tomora wallet. Add your bank details so you can withdraw.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Bank</Label>
            <select
              className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm"
              value={form.bankCode}
              onChange={(e) => {
                const bank = banks.find((b) => b.code === e.target.value);
                setForm((f) => ({ ...f, bankCode: e.target.value, bankName: bank?.name || "" }));
                setSaved(false);
              }}
            >
              <option value="">{banks.length ? "Select your bank" : "Loading banks…"}</option>
              {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Account number</Label>
            <Input inputMode="numeric" maxLength={10} value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, ""))} placeholder="0123456789" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Account name</Label>
          <Input value={form.accountName} onChange={(e) => set("accountName", e.target.value)} placeholder="As it appears on your bank account" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={busy || !form.bankCode || form.accountNumber.length !== 10 || !form.accountName.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
          {saved ? "Saved" : "Save payout account"}
        </Button>
      </CardContent>
    </Card>
  );
}
