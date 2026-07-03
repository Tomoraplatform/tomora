"use client";

import { useState } from "react";
import { Loader2, Check, Heart, Landmark, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { updateDonationTotals } from "@/app/dashboard/(panel)/donations/actions";

export function DonationsManager({
  online, onlineCount, manual: initialManual, goal: initialGoal,
}: {
  online: number;
  onlineCount: number;
  manual: number;
  goal: number;
}) {
  const [manual, setManual] = useState(initialManual);
  const [goal, setGoal] = useState(initialGoal);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = online + Math.max(0, Math.round(manual || 0));
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    try {
      const res = await updateDonationTotals({ manual: Math.max(0, Math.round(manual || 0)), goal: Math.max(0, Math.round(goal || 0)) });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError(res.error || "Could not save. Please try again.");
    } catch (e: any) {
      setError(e?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Donations</h1>
        <p className="mt-1 text-ink/60">Keep your progress bar accurate by recording gifts you receive offline (cash, bank transfer, in person).</p>
      </div>

      {/* Live totals */}
      <Card>
        <CardHeader><CardTitle>Raised so far</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-ink/10 p-3">
              <p className="flex items-center gap-1.5 text-xs text-ink/50"><Landmark className="h-3.5 w-3.5" /> Online (platform)</p>
              <p className="mt-1 text-xl font-bold text-ink">{formatNaira(online)}</p>
              <p className="text-[11px] text-ink/40">{onlineCount} {onlineCount === 1 ? "donation" : "donations"}</p>
            </div>
            <div className="rounded-lg border border-ink/10 p-3">
              <p className="flex items-center gap-1.5 text-xs text-ink/50"><HandCoins className="h-3.5 w-3.5" /> Offline (manual)</p>
              <p className="mt-1 text-xl font-bold text-ink">{formatNaira(Math.max(0, Math.round(manual || 0)))}</p>
              <p className="text-[11px] text-ink/40">You add these</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-cream/50 p-3">
              <p className="flex items-center gap-1.5 text-xs text-ink/50"><Heart className="h-3.5 w-3.5" /> Total shown</p>
              <p className="mt-1 text-xl font-bold text-ink">{formatNaira(total)}</p>
              {goal > 0 && <p className="text-[11px] text-ink/40">{pct}% of {formatNaira(goal)}</p>}
            </div>
          </div>
          {goal > 0 && (
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editable */}
      <Card>
        <CardHeader><CardTitle>Update figures</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Offline / manually-received total (₦)</Label>
            <Input type="number" min={0} value={manual}
              onChange={(e) => setManual(Math.max(0, Math.round(Number(e.target.value) || 0)))} />
            <p className="text-xs text-ink/50">Enter the running total of gifts received off the platform. Online donations are added automatically on top.</p>
          </div>
          <div className="space-y-2">
            <Label>Fundraising goal (₦)</Label>
            <Input type="number" min={0} value={goal}
              onChange={(e) => setGoal(Math.max(0, Math.round(Number(e.target.value) || 0)))} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
          <p className="text-xs text-ink/50">Changes update your live progress bar right away — no need to republish.</p>
        </CardContent>
      </Card>
    </div>
  );
}
