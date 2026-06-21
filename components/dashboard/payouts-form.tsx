"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { savePayoutSettings } from "@/app/dashboard/store-actions";

interface Initial {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  connected: boolean;
}

export function PayoutsForm({ initial }: { initial: Initial }) {
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [bankCode, setBankCode] = useState(initial.bankCode);
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber);
  const [accountName, setAccountName] = useState(initial.accountName);
  const [connected, setConnected] = useState(initial.connected);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/paystack/banks")
      .then((r) => r.json())
      .then((d) => setBanks(d.banks || []))
      .catch(() => {});
  }, []);

  async function submit() {
    setSaving(true); setError(null);
    const bankName = banks.find((b) => b.code === bankCode)?.name || initial.bankName;
    const res = await savePayoutSettings({ bankCode, bankName, accountNumber });
    setSaving(false);
    if (res.ok) {
      setConnected(true);
      if (res.accountName) setAccountName(res.accountName);
    } else {
      setError(res.error || "Could not save.");
    }
  }

  const bankLabel = banks.find((b) => b.code === bankCode)?.name || initial.bankName;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Payouts</h1>
        <p className="mt-1 text-ink/60">Add your bank account to receive payments from your store.</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-cream p-4 text-sm text-ink/70">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          When a customer pays on your store, the money settles straight to this bank account through Paystack —
          you don&apos;t need your own Paystack account.
        </span>
      </div>

      {connected && accountName && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Payouts active — sales go to <span className="font-semibold">{accountName}</span>{bankLabel ? ` (${bankLabel})` : ""}.</span>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Bank account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bank</Label>
            <select
              value={bankCode}
              onChange={(e) => { setBankCode(e.target.value); setConnected(false); }}
              className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm text-ink"
            >
              <option value="">{banks.length ? "Select your bank" : "Loading banks…"}</option>
              {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Account number</Label>
            <Input
              value={accountNumber}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "")); setConnected(false); }}
              placeholder="0123456789"
            />
            <p className="text-xs text-ink/50">We&apos;ll verify the account name with your bank when you save.</p>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={saving || !bankCode || accountNumber.length !== 10}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : connected ? <Check className="h-4 w-4" /> : null}
        {saving ? "Verifying…" : connected ? "Saved" : "Verify & Save"}
      </Button>
    </div>
  );
}
