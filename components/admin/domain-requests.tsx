"use client";

import { useState, useTransition } from "react";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";
import { updateDomainRequest } from "@/app/admin/actions";
import type { DomainRequestStatus } from "@/lib/database.types";

export interface DomainRequestRow {
  id: string;
  domain: string;
  status: DomainRequestStatus;
  amount: number;
  business: string;
  email: string;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, "warning" | "success" | "secondary"> = {
  paid: "warning",
  registered: "warning",
  connected: "success",
  cancelled: "secondary",
};

export function DomainRequestsPanel({ requests }: { requests: DomainRequestRow[] }) {
  const [pending, startTransition] = useTransition();
  const [acting, setActing] = useState<string | null>(null);

  function act(id: string, status: "registered" | "connected" | "cancelled") {
    setActing(id);
    startTransition(async () => {
      await updateDomainRequest(id, status);
      setActing(null);
    });
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4 px-4 pb-12 sm:px-5">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-ink/60" />
        <h2 className="text-lg font-semibold text-ink">Domain purchase requests</h2>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/20 p-8 text-center text-sm text-ink/50">
          No domain purchase requests yet.
        </p>
      ) : (
        <>
        {/* A card each on phones and tablets, where six columns would mean
            scrolling sideways to reach the actions. */}
        <div className="divide-y divide-ink/10 overflow-hidden rounded-xl border border-ink/10 bg-white lg:hidden">
          {requests.map((r) => (
            <div key={r.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{r.domain}</p>
                  <p className="truncate text-xs text-ink/60">{r.business}</p>
                  <p className="truncate text-xs text-ink/40">{r.email}</p>
                </div>
                <Badge variant={STATUS_VARIANT[r.status] || "secondary"}>{r.status}</Badge>
              </div>
              <p className="text-xs text-ink/60">
                {formatNaira(r.amount)} <span className="text-ink/30">·</span> {r.createdAt}
              </p>
              <Actions row={r} pending={pending} acting={acting} act={act} />
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-ink/10 bg-white lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-ink">{r.domain}</td>
                  <td className="px-4 py-3 text-ink/70">{r.business}<br /><span className="text-xs text-ink/40">{r.email}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">{formatNaira(r.amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/60">{r.createdAt}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[r.status] || "secondary"}>{r.status}</Badge></td>
                  <td className="px-4 py-3">
                    <Actions row={r} pending={pending} acting={acting} act={act} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}

/** Shared by the card and the table so the two cannot drift apart. */
function Actions({
  row: r, pending, acting, act,
}: {
  row: DomainRequestRow;
  pending: boolean;
  acting: string | null;
  act: (id: string, status: "registered" | "connected" | "cancelled") => void;
}) {
  if (r.status === "connected" || r.status === "cancelled") {
    return <span className="text-xs text-ink/40">—</span>;
  }
  const busy = pending && acting === r.id;
  return (
    <div className="flex flex-wrap gap-2">
      {r.status === "paid" && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => act(r.id, "registered")}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Mark registered
        </Button>
      )}
      <Button size="sm" disabled={busy} onClick={() => act(r.id, "connected")}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Mark connected
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => act(r.id, "cancelled")}>
        Cancel
      </Button>
    </div>
  );
}
