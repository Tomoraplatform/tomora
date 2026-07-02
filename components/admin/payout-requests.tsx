"use client";

import { useState, useTransition } from "react";
import { Banknote, Loader2, FileText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updatePayoutRequest } from "@/app/admin/actions";

export interface PayoutRequestRow {
  id: string;
  business: string;
  email: string;
  proofUrl: string | null;
  note: string | null;
  status: string;
  createdAt: string;
}

const VARIANT: Record<string, "warning" | "success" | "secondary"> = {
  pending: "warning", approved: "success", declined: "secondary", used: "secondary",
};

export function PayoutRequestsPanel({ requests }: { requests: PayoutRequestRow[] }) {
  const [pending, startTransition] = useTransition();
  const [acting, setActing] = useState<string | null>(null);

  function act(id: string, status: "approved" | "declined") {
    setActing(id);
    startTransition(async () => {
      const res = await updatePayoutRequest(id, status);
      setActing(null);
      if (typeof window !== "undefined" && !res.ok) window.alert(res.error || "Failed.");
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" /> Payout change requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <p className="p-5 text-sm text-ink/50">No payout change requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-y border-ink/10 bg-cream/60 text-left text-ink/60">
                  <tr>
                    <th className="p-3 font-medium">Business</th>
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium">Proof</th>
                    <th className="p-3 font-medium">Note</th>
                    <th className="p-3 font-medium">Requested</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3 font-medium text-ink">{r.business}</td>
                      <td className="p-3 text-ink/70">{r.email}</td>
                      <td className="p-3">
                        {r.proofUrl ? (
                          <a href={r.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-ink underline">
                            <FileText className="h-4 w-4" /> View
                          </a>
                        ) : <span className="text-ink/40">—</span>}
                      </td>
                      <td className="max-w-[220px] p-3 text-ink/60">{r.note || "—"}</td>
                      <td className="p-3 text-ink/60">{r.createdAt}</td>
                      <td className="p-3"><Badge variant={VARIANT[r.status] || "secondary"}>{r.status}</Badge></td>
                      <td className="p-3">
                        {r.status === "pending" ? (
                          <div className="flex gap-1">
                            <Button size="sm" disabled={pending && acting === r.id} onClick={() => act(r.id, "approved")}>
                              {pending && acting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" disabled={pending && acting === r.id} onClick={() => act(r.id, "declined")}>
                              <X className="h-3.5 w-3.5" /> Decline
                            </Button>
                          </div>
                        ) : <span className="text-xs text-ink/40">Reviewed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
