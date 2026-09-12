"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { refreshOutreachDelivery } from "@/app/admin/outreach/actions";

export interface OutreachSend {
  id: string;
  email: string;
  subject: string;
  status: string;
  error: string | null;
  /** What the mail service says became of it, once checked. */
  delivery: string | null;
  when: string;
}

/** Colour by what actually happened, not by what Tomora attempted. */
function tone(s: OutreachSend): string {
  if (s.status !== "sent") return "bg-ink/5 text-ink/60";
  switch (s.delivery) {
    case "delivered": return "bg-emerald-100 text-emerald-800";
    case "bounced":
    case "complained": return "bg-red-100 text-red-800";
    case null: return "bg-amber-100 text-amber-900";
    default: return "bg-amber-100 text-amber-900";
  }
}

function label(s: OutreachSend): string {
  if (s.status === "skipped") return "skipped";
  if (s.status === "failed") return "not sent";
  if (!s.delivery) return "accepted, not checked";
  return s.delivery.replace(/_/g, " ");
}

/**
 * The last messages that went out.
 *
 * "Sent" only means the mail service took it. The delivery column is the
 * answer to the question that matters: did it arrive, bounce, or get marked
 * as spam.
 */
export function OutreachHistory({ sends }: { sends: OutreachSend[] }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setNote(null);
    const res = await refreshOutreachDelivery();
    setBusy(false);
    setNote(res.ok ? `Checked ${res.checked}. Reload to see them.` : res.error || "Could not check.");
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Recent sends</CardTitle>
        <Button size="sm" variant="outline" disabled={busy} onClick={refresh}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Check delivery
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-ink/55">
          Sent means the mail service accepted it. Press Check delivery to ask what became of each one.
        </p>
        {note && <p className="rounded-md bg-cream px-3 py-2 text-sm text-ink/80">{note}</p>}

        {sends.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-ink/50">Nothing sent yet.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ink/5">
                {sends.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3">
                      <p className="font-medium text-ink">{s.email}</p>
                      <p className="truncate text-xs text-ink/50">{s.subject}</p>
                      {s.error && <p className="text-xs text-red-700">{s.error}</p>}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone(s)}`}>{label(s)}</span>
                      <p className="mt-1 text-xs text-ink/45">{s.when}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
