"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Heart, Landmark, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { updateDonationTotals, recordOfflineGift } from "@/app/dashboard/(panel)/donations/actions";

export interface ProjectSummary {
  id: string;
  name: string;
  goal: number;
  raised: number;
  count: number;
}

export interface DonationRecord {
  id: string;
  donorName: string | null;
  donorEmail: string | null;
  amount: number;
  projectName: string | null;
  createdAt: string;
}

export function DonationsManager({
  online, onlineCount, manual: initialManual, manualCount: initialManualCount = 0,
  goal: initialGoal, projects = [], records = [],
  unassignedCount = 0, unassignedRaised = 0,
}: {
  online: number;
  onlineCount: number;
  manual: number;
  manualCount?: number;
  goal: number;
  projects?: ProjectSummary[];
  records?: DonationRecord[];
  /** Paid gifts belonging to no current project, shown so the page adds up. */
  unassignedCount?: number;
  unassignedRaised?: number;
}) {
  const router = useRouter();
  const [manual, setManual] = useState(initialManual);
  const [manualCount, setManualCount] = useState(initialManualCount);
  const [goal, setGoal] = useState(initialGoal);
  // Recording a gift, as opposed to correcting the running totals below it.
  const [giftAmount, setGiftAmount] = useState<number | "">("");
  const [giftProject, setGiftProject] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = online + Math.max(0, Math.round(manual || 0));
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  async function addGift() {
    if (!giftAmount) return;
    setAdding(true); setAdded(false); setError(null);
    try {
      const res = await recordOfflineGift({ amount: Number(giftAmount), projectId: giftProject || undefined });
      if (!res.ok) { setError(res.error || "Could not add that gift."); return; }
      // Reflect it locally too, so the figures above move without a reload.
      if (!giftProject) {
        setManual((m) => m + Number(giftAmount));
        setManualCount((c) => c + 1);
      }
      setGiftAmount("");
      setAdded(true); setTimeout(() => setAdded(false), 2500);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Could not add that gift.");
    } finally {
      setAdding(false);
    }
  }

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    try {
      const res = await updateDonationTotals({
        manual: Math.max(0, Math.round(manual || 0)),
        manualCount: Math.max(0, Math.round(manualCount || 0)),
        goal: Math.max(0, Math.round(goal || 0)),
      });
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

      {/* Per-project breakdown (multi-project fundraising) */}
      {projects.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {projects.map((p) => {
              const ppct = p.goal > 0 ? Math.min(100, Math.round((p.raised / p.goal) * 100)) : 0;
              return (
                <div key={p.id} className="rounded-lg border border-ink/10 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-sm text-ink/60">
                      <span className="font-semibold text-ink">{formatNaira(p.raised)}</span>
                      {p.goal > 0 && <> of {formatNaira(p.goal)}</>}
                    </p>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${ppct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-ink/50">{p.count} {p.count === 1 ? "gift" : "gifts"}{p.goal > 0 ? ` · ${ppct}% of target` : ""}</p>
                </div>
              );
            })}
            {unassignedCount > 0 && (
              <div className="rounded-lg border border-dashed border-ink/20 p-4">
                <p className="font-semibold text-ink">General fund</p>
                <p className="mt-1 text-sm text-ink/60">
                  <span className="font-semibold text-ink">{formatNaira(unassignedRaised)}</span> from{" "}
                  {unassignedCount} {unassignedCount === 1 ? "gift" : "gifts"}
                </p>
                <p className="mt-1.5 text-xs text-ink/50">
                  Given before these projects existed, or to one since removed. The money is already in your
                  wallet; it just is not credited to a project.
                </p>
              </div>
            )}
            <p className="text-xs text-ink/50">Edit project names, descriptions and targets in the editor&apos;s Donations section. Each project&apos;s figure is its online gifts plus the offline amount and gift count you recorded there.</p>
          </CardContent>
        </Card>
      )}

      {/* Recent gifts */}
      {records.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent donations</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-ink/5">
              {records.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{r.donorName || r.donorEmail || "Anonymous"}</p>
                    <p className="truncate text-xs text-ink/50">
                      {r.projectName ? <>{r.projectName} · </> : null}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-ink">{formatNaira(r.amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Record one gift: money and count move together. */}
      <Card>
        <CardHeader><CardTitle>Record an offline gift</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-ink/60">
            Cash, a bank transfer, an envelope handed to you. Adding it here moves the amount and adds one
            to the gift count, so your progress bar and the “gifts” line under it stay in step.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1 space-y-2">
              <Label htmlFor="gift-amount">How much was it? (₦)</Label>
              <Input
                id="gift-amount" type="number" min={1} value={giftAmount}
                placeholder="10000"
                onChange={(e) => setGiftAmount(e.target.value === "" ? "" : Math.max(0, Math.round(Number(e.target.value) || 0)))}
              />
            </div>
            {projects.length > 0 && (
              <div className="min-w-[190px] flex-1 space-y-2">
                <Label htmlFor="gift-project">Which project?</Label>
                <select
                  id="gift-project"
                  value={giftProject}
                  onChange={(e) => setGiftProject(e.target.value)}
                  className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm outline-none focus:border-ink/40"
                >
                  <option value="">General fund</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <Button onClick={addGift} disabled={adding || !giftAmount}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : added ? <Check className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />}
              {adding ? "Adding…" : added ? "Added" : "Add gift"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* Editable */}
      <Card>
        <CardHeader><CardTitle>Correct the totals</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Offline / manually-received total (₦)</Label>
            <Input type="number" min={0} value={manual}
              onChange={(e) => setManual(Math.max(0, Math.round(Number(e.target.value) || 0)))} />
            <p className="text-xs text-ink/50">The running total of gifts received off the platform. Online donations are added automatically on top.</p>
          </div>
          <div className="space-y-2">
            <Label>Number of offline gifts</Label>
            <Input type="number" min={0} value={manualCount}
              onChange={(e) => setManualCount(Math.max(0, Math.round(Number(e.target.value) || 0)))} />
            <p className="text-xs text-ink/50">How many gifts that total represents. “Add gift” above keeps this in step for you; edit it here only to correct a mistake.</p>
          </div>
          <div className="space-y-2">
            <Label>Fundraising goal (₦)</Label>
            <Input type="number" min={0} value={goal}
              onChange={(e) => setGoal(Math.max(0, Math.round(Number(e.target.value) || 0)))} />
            {projects.length > 0 && (
              <p className="text-xs text-ink/50">Your site currently uses per-project targets, so this general goal isn&apos;t shown to visitors.</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
          <p className="text-xs text-ink/50">Changes update your live progress bar right away, no need to republish.</p>
        </CardContent>
      </Card>
    </div>
  );
}
