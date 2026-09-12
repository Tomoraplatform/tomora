"use client";

import { useTransition } from "react";
import { Building2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setCurrentSite } from "@/app/dashboard/(panel)/templates/actions";

export interface SitePayout {
  id: string;
  name: string;
  host: string;
  /** "GTBank 0123456789", or null when no bank is connected. */
  bank: string | null;
  takesMoney: boolean;
}

/**
 * The owner's other websites and the bank each one pays into.
 *
 * A payout bank belongs to one website, not to the account. Without this, an
 * owner who connects a bank on their first site has no reason to think the
 * second one still cannot be paid, and finds out from a customer who could
 * not check out.
 */
export function OtherSitePayouts({ sites }: { sites: SitePayout[] }) {
  const [pending, startTransition] = useTransition();
  if (!sites.length) return null;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader><CardTitle>Your other websites</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-ink/55">
          Each website is paid into its own bank account. Switch to one to set its payouts up.
        </p>
        {sites.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink/10 p-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-medium text-ink">
                {s.bank
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />}
                {s.name}
              </p>
              <p className="truncate text-xs text-ink/55">{s.host}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink/70">
                <Building2 className="h-3.5 w-3.5 text-ink/40" />
                {s.bank ?? (s.takesMoney
                  ? "No bank connected, so it cannot take payments"
                  : "No bank connected")}
              </p>
            </div>
            <Button size="sm" variant="outline" disabled={pending}
              onClick={() => startTransition(() => { setCurrentSite(s.id); })}>
              Switch to this site
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
