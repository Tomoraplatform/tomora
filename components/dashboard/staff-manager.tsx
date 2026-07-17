"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, UsersRound, Lock, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STAFF_AREAS } from "@/lib/constants";
import { addStaff, removeStaff } from "@/app/dashboard/(panel)/staff/actions";

export interface StaffRow {
  id: string;
  name: string;
  role: string | null;
  email: string;
  phone: string | null;
  areas: string[];
  created_at: string;
}

const blankForm = { name: "", role: "", email: "", phone: "", areas: [] as string[] };

export function StaffManager({ staff, hasTeamPlan }: { staff: StaffRow[]; hasTeamPlan: boolean }) {
  const [form, setForm] = useState({ ...blankForm });
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleArea = (id: string) =>
    setForm((f) => ({ ...f, areas: f.areas.includes(id) ? f.areas.filter((a) => a !== id) : [...f.areas, id] }));

  async function submit() {
    setError(null);
    setBusy(true);
    const res = await addStaff(form);
    setBusy(false);
    if (res.ok) { setForm({ ...blankForm }); setShowForm(false); window.location.reload(); }
    else setError(res.error || "Could not add staff.");
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remove ${name}? Their access ends immediately.`)) return;
    setRemoving(id);
    const res = await removeStaff(id);
    setRemoving(null);
    if (res.ok) window.location.reload();
    else alert(res.error || "Could not remove staff.");
  }

  const areaLabel = (id: string) => STAFF_AREAS.find((a) => a.id === id)?.label || id;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Staff</h1>
        <p className="mt-1 text-ink/60">Give your team access to the parts of your dashboard they need. Staff sign in with their own account, no shared passwords.</p>
      </div>

      {!hasTeamPlan && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink"><Lock className="h-5 w-5" /></span>
            <p className="font-semibold text-ink">Staff accounts are part of the Growth plan</p>
            <p className="max-w-sm text-sm text-ink/60">Upgrade to Growth to add team members with their own scoped access to orders, products, messages and more.</p>
            <Button asChild><Link href="/dashboard/billing">Upgrade to Growth</Link></Button>
          </CardContent>
        </Card>
      )}

      {hasTeamPlan && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><UsersRound className="h-5 w-5" /> Your team</CardTitle>
                {!showForm && <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Add staff</Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.length === 0 && !showForm && (
                <p className="rounded-lg border border-dashed border-ink/15 py-8 text-center text-sm text-ink/50">No staff yet, add your first team member.</p>
              )}
              {staff.map((s) => (
                <div key={s.id} className="rounded-xl border border-ink/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{s.name}{s.role ? <span className="ml-2 text-sm font-normal text-ink/50">{s.role}</span> : null}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {s.email}</span>
                        {s.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {s.phone}</span>}
                      </p>
                    </div>
                    <button onClick={() => remove(s.id, s.name)} className="text-ink/40 hover:text-destructive" aria-label="Remove staff">
                      {removing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {s.areas.map((a) => <Badge key={a} variant="secondary">{areaLabel(a)}</Badge>)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {showForm && (
            <Card>
              <CardHeader><CardTitle>Add a staff member</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ada Obi" /></div>
                  <div className="space-y-1.5"><Label>Role</Label><Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Store manager" /></div>
                  <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="They'll sign in with this" /></div>
                  <div className="space-y-1.5"><Label>Phone number</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+234…" /></div>
                </div>
                <div className="space-y-2">
                  <Label>What can they access?</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {STAFF_AREAS.map((a) => (
                      <label key={a.id} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition ${form.areas.includes(a.id) ? "border-ink bg-ink/[0.03]" : "border-ink/10"}`}>
                        <input type="checkbox" className="mt-0.5" checked={form.areas.includes(a.id)} onChange={() => toggleArea(a.id)} />
                        <span>
                          <span className="block text-sm font-medium text-ink">{a.label}</span>
                          <span className="block text-xs text-ink/50">{a.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button onClick={submit} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add & send invite
                  </Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setError(null); }}>Cancel</Button>
                </div>
                <p className="text-xs text-ink/50">They&apos;ll get an email invite. Once they sign in to Tomora with that email, they&apos;ll see your dashboard limited to the areas you selected.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
