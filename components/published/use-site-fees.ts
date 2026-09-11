"use client";

import { useEffect, useState } from "react";
import type { FeeRate } from "@/lib/platform-fee";

export interface SiteFees {
  rate: FeeRate;
  allowBankTransfer: boolean;
}

/**
 * The transaction fee a published site's customers pay, read once.
 *
 * Null until it arrives, and on any failure. Callers treat null as "no fee
 * shown, every method offered", which is safe: the server resolves the fee
 * again at checkout, charges that, and refuses a method the plan does not
 * allow.
 */
export function useSiteFees(siteId?: string | null): SiteFees | null {
  const [fees, setFees] = useState<SiteFees | null>(null);
  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    fetch(`/api/fees?siteId=${encodeURIComponent(siteId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setFees({
          rate: { percent: Number(d.percent) || 0, flat: Number(d.flat) || 0 },
          allowBankTransfer: d.allowBankTransfer !== false,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [siteId]);
  return fees;
}
