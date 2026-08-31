"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ArrowDownLeft, Loader2, Check, RotateCcw, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { resetWalletTotal } from "@/app/dashboard/(panel)/wallet/actions";

export interface WalletTx {
  id: string;
  type: "income" | "withdrawal";
  source: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

/**
 * A record of what has come in, not an account holding money.
 *
 * Customers' payments go straight from Paystack to the bank the owner
 * connected, so there is nothing here for Tomora to pay out. What remains
 * useful is the running total and the history, and being able to start the
 * count again at the top of a season.
 */
export function WalletManager({
  received, transactions, bank, resetAt,
}: {
  received: number;
  transactions: WalletTx[];
  bank: { accountNumber: string | null; accountName: string | null; bankName: string | null; connected: boolean };
  /** When the running total was last restarted, if it has been. */
  resetAt?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reset() {
    if (!confirm("Start the received total again from zero? Your payment history stays, only the total restarts.")) return;
    setBusy(true); setError(null);
    try {
      const res = await resetWalletTotal();
      if (!res.ok) { setError(res.error || "Could not restart the total."); return; }
      setDone(true); setTimeout(() => setDone(false), 2500);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Could not restart the total.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Payments received</h1>
        <p className="mt-1 max-w-2xl text-ink/60">
          Every payment your customers and supporters make goes straight to your own bank account
          through Paystack. Tomora never holds your money. This page is the record of what has come in.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-1.5 text-xs text-ink/50">
              <ArrowDownLeft className="h-3.5 w-3.5" /> Received so far
            </p>
            <p className="mt-1 text-3xl font-bold text-ink">{formatNaira(received)}</p>
            {resetAt && (
              <p className="mt-1 text-xs text-ink/40">
                Counting from {new Date(resetAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="flex items-center gap-1.5 text-xs text-ink/50">
              <Landmark className="h-3.5 w-3.5" /> Paid into
            </p>
            {bank.connected ? (
              <>
                <p className="mt-1 truncate text-lg font-bold text-ink">{bank.accountNumber}</p>
                <p className="truncate text-sm text-ink/60">
                  {bank.accountName}{bank.bankName ? ` · ${bank.bankName}` : ""}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-amber-700">
                No payout bank connected yet, so card payments are switched off. Add one in Payouts.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="p-5 text-sm text-ink/50">No payments yet. They will appear here as they come in.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {transactions.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {t.description || (t.type === "income" ? "Payment received" : "Withdrawal")}
                    </p>
                    <p className="text-xs text-ink/50">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-ink">{formatNaira(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Start the total again</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink/60">
            Sets “received so far” back to zero and counts from today. Useful at the start of a
            campaign or a new month. Your payment history is kept.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button variant="outline" onClick={reset} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
            {busy ? "Restarting…" : done ? "Restarted" : "Restart total"}
          </Button>
        </CardContent>
      </Card>

      <p className="flex items-start gap-2 text-xs text-ink/45">
        <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Payments settle on Paystack&rsquo;s normal schedule, straight to your bank. If something is
        missing, check your Paystack dashboard or your bank statement first.
      </p>
    </div>
  );
}
