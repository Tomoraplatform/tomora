"use client";

import { useState } from "react";
import { Loader2, Check, CreditCard, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAYSTACK_FEE_PERCENT } from "@/lib/constants";
import { savePaymentSettings } from "@/app/dashboard/store-actions";

export function PaymentOptions({
  connected,
  initial,
  donationOnly = false,
}: {
  connected: boolean;
  initial: { paystack: boolean; transfer: boolean; feeBearer: "customer" | "owner" };
  donationOnly?: boolean;
}) {
  const [paystack, setPaystack] = useState(donationOnly ? true : initial.paystack);
  const [transfer, setTransfer] = useState(donationOnly ? false : initial.transfer);
  const [feeBearer, setFeeBearer] = useState<"customer" | "owner">(initial.feeBearer);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!donationOnly && !paystack && !transfer) { setError("Enable at least one payment method."); return; }
    setSaving(true); setSaved(false); setError(null);
    const res = await savePaymentSettings({ paystack, transfer, feeBearer });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else setError(res.error || "Could not save.");
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader><CardTitle>{donationOnly ? "Donation payment fee" : "Payment options at checkout"}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {!connected && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Connect your payout bank above first, {donationOnly ? "this activates" : "payment options activate"} once it&apos;s set up.</p>
        )}

        {!donationOnly && (
        <>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-ink/10 p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 text-ink/60" />
            <div>
              <p className="font-medium text-ink">Pay online (Paystack)</p>
              <p className="text-sm text-ink/55">Card, bank or USSD. Payments land in your Tomora Wallet, withdraw anytime.</p>
            </div>
          </div>
          <Switch checked={paystack} onCheckedChange={setPaystack} disabled={!connected} />
        </div>

        <div className="flex items-start justify-between gap-3 rounded-lg border border-ink/10 p-4">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 h-5 w-5 text-ink/60" />
            <div>
              <p className="font-medium text-ink">Direct bank transfer</p>
              <p className="text-sm text-ink/55">Customers transfer to your account; you confirm each order as paid.</p>
            </div>
          </div>
          <Switch checked={transfer} onCheckedChange={setTransfer} disabled={!connected} />
        </div>
        </>
        )}

        {(paystack || donationOnly) && (
          <div className="rounded-lg border border-ink/10 p-4">
            <p className="text-sm font-medium text-ink">Who pays the {PAYSTACK_FEE_PERCENT}% Paystack fee?</p>
            <div className="mt-3 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" name="feeBearer" checked={feeBearer === "owner"} onChange={() => setFeeBearer("owner")} /> I&apos;ll cover it (deducted from each payout)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" name="feeBearer" checked={feeBearer === "customer"} onChange={() => setFeeBearer("customer")} /> Customer pays it (added to their total at checkout)
              </label>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={save} disabled={saving || !connected}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saving ? "Saving…" : saved ? "Saved" : "Save payment options"}
        </Button>
      </CardContent>
    </Card>
  );
}
