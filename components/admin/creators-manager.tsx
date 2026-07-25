"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, ExternalLink, Check, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { setCourseFeatured, markCreatorPayoutPaid, rejectCreatorPayout } from "@/app/admin/creators/actions";

export interface AdminCreatorRow {
  courseId: string; title: string; slug: string; creatorSlug: string; authorName: string;
  email: string; price: number; purchases: number; lessons: number;
  isPublished: boolean; isActive: boolean; featured: boolean;
  bannerUrl: string | null; createdAt: string;
}

export interface AdminPayoutRow {
  id: string; authorName: string; bank: string; amount: number; status: string; createdAt: string;
}

export function CreatorsManager({ rows, payouts }: { rows: AdminCreatorRow[]; payouts: AdminPayoutRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (!res.ok) { window.alert(res.error || "Something went wrong."); return; }
    router.refresh();
  }

  const pending = payouts.filter((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      {/* payout requests first, they need action */}
      {pending.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink/60">Payout requests ({pending.length})</h2>
            <div className="divide-y divide-ink/5 rounded-lg border border-ink/10 bg-white">
              {pending.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{p.authorName} · {formatNaira(p.amount)}</p>
                    <p className="truncate text-xs text-ink/50">{p.bank}</p>
                  </div>
                  <span className="text-xs text-ink/40">{new Date(p.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
                  <Button size="sm" disabled={busy === `pay-${p.id}`} onClick={() => run(`pay-${p.id}`, () => markCreatorPayoutPaid(p.id))}>
                    {busy === `pay-${p.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Mark paid
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" disabled={busy === `rej-${p.id}`}
                    onClick={() => { if (window.confirm(`Reject ${p.authorName}'s withdrawal of ${formatNaira(p.amount)}?`)) run(`rej-${p.id}`, () => rejectCreatorPayout(p.id)); }}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* creator courses */}
      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">No creator courses yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.courseId}>
              <CardContent className="flex flex-wrap items-center gap-4 pt-6">
                <span className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink/5">
                  {r.bannerUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={r.bannerUrl} alt="" className="h-full w-full object-cover" />
                    : <ImageIcon className="h-5 w-5 text-ink/30" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{r.title}</p>
                  <p className="truncate text-xs text-ink/55">
                    {r.authorName} · {r.email} · {r.lessons} lesson{r.lessons === 1 ? "" : "s"} · {r.price > 0 ? formatNaira(r.price) : "Free"} · {r.purchases} sale{r.purchases === 1 ? "" : "s"}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink/60"}`}>
                  {r.isPublished ? "Live" : "Draft"}
                </span>
                {r.isPublished && r.creatorSlug && (
                  <a href={`/c/${r.creatorSlug}/${r.slug}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-ink/60 underline hover:text-ink">
                    <ExternalLink className="h-3 w-3" /> View
                  </a>
                )}
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Switch checked={r.featured} onCheckedChange={(v) => run(`feat-${r.courseId}`, () => setCourseFeatured(r.courseId, v))} />
                  <span className="inline-flex items-center gap-1"><Star className={`h-3.5 w-3.5 ${r.featured ? "fill-amber-400 text-amber-400" : "text-ink/30"}`} /> On Academy</span>
                </label>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
