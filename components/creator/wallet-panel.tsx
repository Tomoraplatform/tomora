"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { requestCreatorPayout } from "@/app/academy/sell/wallet-actions";

const MIN_WITHDRAWAL = 5000;

export function WalletPanel({ balance, earned, withdrawn, hasBank, transactions }: {
  balance: number;
  earned: number;
  withdrawn: number;
  hasBank: boolean;
  transactions: { id: string; type: string; source: string | null; amount: number; status: string; description: string | null; created_at: string }[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(Math.min(balance, Math.max(MIN_WITHDRAWAL, balance)));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    setBusy(true); setError(null);
    const res = await requestCreatorPayout(amount);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Could not request the withdrawal."); return; }
    setDone(true);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-ink/15 bg-ink p-5 text-cream">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-cream/70" />
              <span className="text-xs font-semibold uppercase tracking-wide text-cream/70">Available</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatNaira(balance)}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Total earned</span>
            <p className="mt-2 text-2xl font-bold text-ink">{formatNaira(earned)}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Withdrawn</span>
            <p className="mt-2 text-2xl font-bold text-ink">{formatNaira(withdrawn)}</p>
          </div>
        </div>

        {!hasBank ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Add your payout bank account below before you can withdraw.
          </p>
        ) : done ? (
          <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" /> Withdrawal requested. We&apos;ll send it to your bank shortly.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink/60">Withdraw amount (₦)</label>
                <Input type="number" min={MIN_WITHDRAWAL} max={balance} value={amount}
                  onChange={(e) => { setAmount(Math.max(0, Number(e.target.value) || 0)); setError(null); }}
                  className="w-40" />
              </div>
              <Button onClick={withdraw} disabled={busy || balance < MIN_WITHDRAWAL || amount > balance || amount < MIN_WITHDRAWAL}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />} Withdraw
              </Button>
            </div>
            <p className="text-xs text-ink/50">Minimum withdrawal is {formatNaira(MIN_WITHDRAWAL)}. Paid to your bank account on file.</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {transactions.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Recent activity</p>
            <div className="divide-y divide-ink/5 rounded-lg border border-ink/10 bg-white">
              {transactions.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{t.description || (t.type === "income" ? "Course sale" : "Withdrawal")}</p>
                    <p className="text-xs text-ink/45">
                      {new Date(t.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      {t.status !== "completed" ? ` · ${t.status}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-ink/70"}`}>
                    {t.type === "income" ? "+" : "-"}{formatNaira(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
