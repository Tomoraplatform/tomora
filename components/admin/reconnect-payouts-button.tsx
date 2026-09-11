"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reconnectSubaccount } from "@/app/admin/actions";

/** Rebuilds a site's Paystack payout account from its saved bank details. */
export function ReconnectPayoutsButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    if (!confirm(`Create a new Paystack payout account for ${siteName} from the bank details it already has saved? Its payments will settle to that same bank.`)) return;
    setBusy(true);
    setResult(null);
    const res = await reconnectSubaccount(siteId);
    setBusy(false);
    setResult(res.ok ? `Reconnected to ${res.accountName}. Reload to re-check.` : res.error || "Could not reconnect.");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" disabled={busy} onClick={run}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Reconnect payouts
      </Button>
      {result && <p className="max-w-xs text-right text-xs text-ink/60">{result}</p>}
    </div>
  );
}
