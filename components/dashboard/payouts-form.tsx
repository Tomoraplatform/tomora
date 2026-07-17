"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Check, Info, CheckCircle2, Lock, UploadCloud, ShieldCheck, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { savePayoutSettings, requestPayoutChange } from "@/app/dashboard/store-actions";
import { uploadMedia } from "@/lib/upload";

interface Initial {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  connected: boolean;
}

export function PayoutsForm({ initial, changeStatus = null }: { initial: Initial; changeStatus?: string | null }) {
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [bankCode, setBankCode] = useState(initial.bankCode);
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber);
  const [accountName, setAccountName] = useState(initial.accountName);
  const [connected, setConnected] = useState(initial.connected);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Change-request state (only relevant once a bank is already connected).
  const [status, setStatus] = useState<string | null>(changeStatus);

  useEffect(() => {
    fetch("/api/paystack/banks")
      .then((r) => r.json())
      .then((d) => setBanks(d.banks || []))
      .catch(() => {});
  }, []);

  async function submit() {
    setSaving(true); setError(null);
    try {
      const bankName = banks.find((b) => b.code === bankCode)?.name || initial.bankName;
      const res = await savePayoutSettings({ bankCode, bankName, accountNumber });
      if (res.ok) {
        setConnected(true);
        setStatus("used"); // approval (if any) is now consumed
        if (res.accountName) setAccountName(res.accountName);
      } else {
        setError(res.error || "Could not save. Please check the details and try again.");
      }
    } catch (e: any) {
      setError(e?.message || "Could not reach the bank service. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const bankLabel = banks.find((b) => b.code === bankCode)?.name || initial.bankName;
  // Editing is open during initial setup, or once a change request is approved.
  const canEdit = !connected || status === "approved";

  const bankForm = (
    <Card>
      <CardHeader><CardTitle>{connected ? "Update bank account" : "Bank account"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Bank</Label>
          <select
            value={bankCode}
            onChange={(e) => { setBankCode(e.target.value); }}
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
            onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "")); }}
            placeholder="0123456789"
          />
          <p className="text-xs text-ink/50">We&apos;ll verify the account name with your bank when you save.</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={saving || !bankCode || accountNumber.length !== 10}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? "Verifying…" : "Verify & Save"}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Payouts</h1>
        <p className="mt-1 text-ink/60">Add the bank account that receives payments and donations from your site.</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-cream p-4 text-sm text-ink/70">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          When someone pays or donates on your site, the money settles straight to this bank account through Paystack,
          you don&apos;t need your own Paystack account.
        </span>
      </div>

      {connected && accountName && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Payouts active, money goes to <span className="font-semibold">{accountName}</span>{bankLabel ? ` (${bankLabel})` : ""}.</span>
        </div>
      )}

      {canEdit ? (
        <>
          {connected && status === "approved" && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
              <ShieldCheck className="h-5 w-5 shrink-0" /> Your change request was approved. Update your bank details below.
            </div>
          )}
          {bankForm}
        </>
      ) : (
        <ChangeRequest status={status} onSubmitted={() => setStatus("pending")} />
      )}
    </div>
  );
}

/** Locked view + "request to change payout bank" flow (proof upload). */
function ChangeRequest({ status, onSubmitted }: { status: string | null; onSubmitted: () => void }) {
  const [proofUrl, setProofUrl] = useState("");
  const [proofName, setProofName] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setUploading(true); setError(null);
    const { url, error } = await uploadMedia(file, "branding", 10 * 1024 * 1024);
    setUploading(false);
    if (url) { setProofUrl(url); setProofName(file.name); }
    else setError(error || "Could not upload the file.");
  }

  async function submit() {
    setBusy(true); setError(null);
    try {
      const res = await requestPayoutChange({ proofUrl, note });
      if (res.ok) onSubmitted();
      else setError(res.error || "Could not submit your request.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "pending") {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold text-ink">Change request under review</p>
            <p className="mt-1 text-sm text-ink/60">Our team is reviewing your proof of ownership. You&apos;ll be able to update your payout bank once it&apos;s approved.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Change payout bank</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "declined" && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> Your previous request was declined. You can submit a new one with valid proof below.
          </div>
        )}
        <p className="text-sm text-ink/60">
          For your security, your payout bank is locked. To change it, request access and upload <span className="font-medium">proof of ownership</span> of the new account,
          an image or PDF of a bank statement showing a name that matches the current account holder.
        </p>

        <div className="space-y-2">
          <Label>Proof of ownership (image or PDF)</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink/25 p-3 hover:bg-ink/[0.02]">
            <span className="flex h-10 w-10 items-center justify-center rounded bg-ink text-cream">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            </span>
            <span className="min-w-0 text-sm text-ink/60">{proofName ? <span className="truncate font-medium text-ink">{proofName}</span> : uploading ? "Uploading…" : "Upload bank statement (max 10MB)"}</span>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>

        <div className="space-y-2">
          <Label>Note to support (optional)</Label>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the reviewer should know (e.g. the new bank and why you're changing)." />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={busy || uploading || !proofUrl}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Request change access
        </Button>
      </CardContent>
    </Card>
  );
}
