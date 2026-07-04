"use client";

import { useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader2, Check, Landmark, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { WALLET_SINGLE_WITHDRAWAL_LIMIT, WALLET_DAILY_WITHDRAWAL_LIMIT } from "@/lib/constants";
import { withdrawFromWallet } from "@/app/dashboard/(panel)/wallet/actions";

export interface WalletTx {
  id: string;
  type: "income" | "withdrawal";
  source: string | null;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

export function WalletManager({
  balance, totalIncome, totalWithdrawn, transactions, unlimited, bank,
}: {
  balance: number;
  totalIncome: number;
  totalWithdrawn: number;
  transactions: WalletTx[];
  unlimited: boolean;
  bank: { accountNumber: string | null; accountName: string | null; bankName: string | null; connected: boolean };
}) {
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "pending" | "error"; text: string } | null>(null);

  async function withdraw() {
    setNotice(null);
    if (!amount || amount < 100) { setNotice({ kind: "error", text: "Enter an amount of at least ₦100." }); return; }
    setBusy(true);
    try {
      const res = await withdrawFromWallet(amount);
      if (!res.ok) setNotice({ kind: "error", text: res.error || "Could not process the withdrawal." });
      else if (res.pending) setNotice({ kind: "pending", text: "Withdrawal requested — it's being processed and will land in your bank shortly." });
      else setNotice({ kind: "ok", text: "Withdrawal sent to your bank." });
      if (res.ok) setAmount(0);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Tomora Wallet</h1>
        <p className="mt-1 text-ink/60">Payments made through Paystack by your customers and audience land here. Withdraw to your connected bank anytime.</p>
      </div>

      {/* Balance */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardContent className="p-5">
            <p className="flex items-center gap-1.5 text-xs text-ink/50"><Wallet className="h-3.5 w-3.5" /> Available balance</p>
            <p className="mt-1 text-2xl font-bold text-ink">{formatNaira(balance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-1.5 text-xs text-ink/50"><ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" /> Total income</p>
            <p className="mt-1 text-2xl font-bold text-ink">{formatNaira(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-1.5 text-xs text-ink/50"><ArrowUpRight className="h-3.5 w-3.5 text-ink/60" /> Withdrawn</p>
            <p className="mt-1 text-2xl font-bold text-ink">{formatNaira(totalWithdrawn)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw */}
      <Card>
        <CardHeader><CardTitle>Withdraw</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {bank.connected ? (
            <p className="flex items-center gap-2 rounded-lg bg-cream/70 px-3 py-2.5 text-sm text-ink/70">
              <Landmark className="h-4 w-4 shrink-0" />
              Paid out to <span className="font-semibold text-ink">{bank.accountNumber}</span>
              {bank.accountName ? <> ({bank.accountName}{bank.bankName ? `, ${bank.bankName}` : ""})</> : null}
            </p>
          ) : (
            <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">Connect your payout bank first (Dashboard → Payouts) to withdraw.</p>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Amount (₦)</Label>
              <Input type="number" min={100} value={amount || ""} placeholder="0"
                onChange={(e) => setAmount(Math.max(0, Math.round(Number(e.target.value) || 0)))} />
            </div>
            <Button onClick={withdraw} disabled={busy || !bank.connected || balance <= 0}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Withdraw
            </Button>
          </div>
          {notice && (
            <p className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
              notice.kind === "error" ? "bg-red-50 text-red-700" : notice.kind === "pending" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
            }`}>
              {notice.kind === "ok" ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : notice.kind === "pending" ? <Clock className="mt-0.5 h-4 w-4 shrink-0" /> : null}
              {notice.text}
            </p>
          )}
          <p className="text-xs text-ink/50">
            {unlimited
              ? "Your plan has no withdrawal limits."
              : `Limits on your plan: up to ${formatNaira(WALLET_SINGLE_WITHDRAWAL_LIMIT)} per withdrawal and ${formatNaira(WALLET_DAILY_WITHDRAWAL_LIMIT)} per day. Upgrade to Growth for unlimited withdrawals.`}
          </p>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader><CardTitle>Transaction history</CardTitle></CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="p-5 text-sm text-ink/50">No transactions yet. Paystack payments from your customers will appear here.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-ink/5 text-ink/60"}`}>
                    {t.type === "income" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{t.description || (t.type === "income" ? "Payment received" : "Withdrawal")}</p>
                    <p className="text-xs text-ink/45">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-ink"}`}>
                      {t.type === "income" ? "+" : "−"}{formatNaira(t.amount)}
                    </p>
                    {t.status !== "completed" && (
                      <Badge variant={t.status === "pending" ? "warning" : "secondary"}>{t.status}</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
