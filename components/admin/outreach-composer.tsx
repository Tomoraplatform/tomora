"use client";

import { useMemo, useState } from "react";
import { Loader2, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  OUTREACH_TEMPLATES, STAGE_LABEL, daysSince, greetingName, renderTemplate,
  MAX_PER_SEND, type Filters, type Stage,
} from "@/lib/outreach";
import { sendOutreach } from "@/app/admin/outreach/actions";

export interface OutreachRow {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  stage: Stage;
  plan: string;
  host: string;
  lastContactedAt: string | null;
  optedOut: boolean;
}

const STAGES: Stage[] = ["no_site", "unpublished", "no_payouts", "no_products", "no_sales", "active"];
/** Active people are not dormant, so they start off the list. */
const DEFAULT_STAGES: Stage[] = ["no_site", "unpublished", "no_payouts", "no_products", "no_sales"];

export function OutreachComposer({ rows, disabled = false }: { rows: OutreachRow[]; disabled?: boolean }) {
  const [filters, setFilters] = useState<Filters>({ stages: DEFAULT_STAGES, minAgeDays: 7, quietDays: 30 });
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState(OUTREACH_TEMPLATES[0].id);
  const [subject, setSubject] = useState(OUTREACH_TEMPLATES[0].subject);
  const [body, setBody] = useState(OUTREACH_TEMPLATES[0].body);
  const [booking, setBooking] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Someone who opted out, or has no address, is never on the list: the send
  // checks that again, and a row that can only be refused should not be here.
  const matching = useMemo(() => {
    const now = Date.now();
    return rows.filter((r) => {
      if (r.optedOut || !r.email) return false;
      if (!filters.stages.includes(r.stage)) return false;
      const age = daysSince(r.createdAt, now);
      if (age == null || age < filters.minAgeDays) return false;
      if (filters.quietDays > 0) {
        const since = daysSince(r.lastContactedAt, now);
        if (since != null && since < filters.quietDays) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const selected = matching.filter((r) => picked.has(r.userId));
  const overCap = selected.length > MAX_PER_SEND;

  function applyTemplate(id: string) {
    const t = OUTREACH_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setTemplate(id);
    setSubject(t.subject);
    setBody(t.body);
  }

  function toggleStage(s: Stage) {
    setFilters((f) => ({
      ...f,
      stages: f.stages.includes(s) ? f.stages.filter((x) => x !== s) : [...f.stages, s],
    }));
  }

  function selectAll() {
    setPicked(new Set(matching.slice(0, MAX_PER_SEND).map((r) => r.userId)));
  }

  const preview = useMemo(() => {
    const who = selected[0] || matching[0];
    if (!who) return null;
    return {
      to: who.email,
      subject,
      text: renderTemplate(body, {
        name: greetingName(who.name, who.email),
        site: who.host || "your-name.tomora.com.ng",
        dashboard: "https://www.tomora.com.ng/dashboard",
        booking: booking.trim() || "(your booking link)",
      }),
    };
  }, [selected, matching, subject, body, booking]);

  async function send() {
    const n = selected.length;
    if (!n) return;
    if (!confirm(`Send this email to ${n} ${n === 1 ? "person" : "people"} now? It goes out from your Tomora support address.`)) return;
    setBusy(true);
    setResult(null);
    const res = await sendOutreach({
      userIds: selected.map((r) => r.userId), subject, body, bookingLink: booking,
    });
    setBusy(false);
    if (res.error) { setResult(res.error); return; }
    setPicked(new Set());
    setResult(
      `Sent ${res.sent}${res.failed ? `, ${res.failed} failed` : ""}${res.skipped ? `, ${res.skipped} skipped (opted out)` : ""}.` +
      (res.problems.length ? ` ${res.problems.join("; ")}` : "")
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- who ---- */}
      <Card>
        <CardHeader><CardTitle>Who to email</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => toggleStage(s)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  filters.stages.includes(s) ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink/60 hover:border-ink/40"
                }`}
              >
                {STAGE_LABEL[s]} ({rows.filter((r) => r.stage === s).length})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-ink/60">Signed up at least</span>
              <input type="number" min={0} max={365} value={filters.minAgeDays}
                onChange={(e) => setFilters((f) => ({ ...f, minAgeDays: Math.max(0, Number(e.target.value) || 0) }))}
                className="h-9 w-20 rounded-md border border-ink/15 px-2" />{" "}
              <span className="text-ink/60">days ago</span>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-ink/60">Not emailed in the last</span>
              <input type="number" min={0} max={365} value={filters.quietDays}
                onChange={(e) => setFilters((f) => ({ ...f, quietDays: Math.max(0, Number(e.target.value) || 0) }))}
                className="h-9 w-20 rounded-md border border-ink/15 px-2" />{" "}
              <span className="text-ink/60">days</span>
            </label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAll}>
                Select {Math.min(matching.length, MAX_PER_SEND)}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>Clear</Button>
            </div>
          </div>

          <p className="text-sm text-ink/60">
            {matching.length} {matching.length === 1 ? "person matches" : "people match"} · {selected.length} selected
            {overCap && <span className="ml-2 font-medium text-destructive">Select at most {MAX_PER_SEND}.</span>}
          </p>

          <div className="max-h-96 overflow-y-auto rounded-lg border border-ink/10">
            {matching.length === 0 ? (
              <p className="p-6 text-center text-sm text-ink/50">Nobody matches these filters.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-ink/5">
                  {matching.map((r) => {
                    const age = daysSince(r.createdAt);
                    const since = daysSince(r.lastContactedAt);
                    return (
                      <tr key={r.userId} className={picked.has(r.userId) ? "bg-cream/60" : ""}>
                        <td className="w-10 p-3">
                          <input
                            type="checkbox"
                            checked={picked.has(r.userId)}
                            onChange={(e) => setPicked((p) => {
                              const next = new Set(p);
                              if (e.target.checked) next.add(r.userId); else next.delete(r.userId);
                              return next;
                            })}
                          />
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-ink">{r.name || greetingName(r.name, r.email)}</p>
                          <p className="text-xs text-ink/55">{r.email}</p>
                        </td>
                        <td className="p-3 text-ink/70">
                          <Badge variant="secondary">{STAGE_LABEL[r.stage]}</Badge>
                        </td>
                        <td className="p-3 text-xs text-ink/55">
                          {age != null ? `joined ${age}d ago` : ""}
                          {since != null ? ` · emailed ${since}d ago` : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---- what ---- */}
      <Card>
        <CardHeader><CardTitle>The message</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {OUTREACH_TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => applyTemplate(t.id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  template === t.id ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink/60 hover:border-ink/40"
                }`}>
                {t.name}
              </button>
            ))}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-ink/60">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              className="h-10 w-full rounded-md border border-ink/15 px-3" />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-ink/60">
              Message · {"{{name}}"} {"{{site}}"} {"{{dashboard}}"} {"{{booking}}"} are filled in for each person
            </span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14}
              className="w-full rounded-md border border-ink/15 p-3 font-mono text-[13px]" />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-ink/60">
              Booking link (Calendly, Google Calendar, WhatsApp…), fills {"{{booking}}"}
            </span>
            <input value={booking} onChange={(e) => setBooking(e.target.value)} placeholder="https://calendly.com/…"
              className="h-10 w-full rounded-md border border-ink/15 px-3" />
          </label>

          <button onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
            <Eye className="h-4 w-4" /> {showPreview ? "Hide" : "Show"} preview
          </button>

          {showPreview && preview && (
            <div className="rounded-lg border border-ink/10 bg-cream/50 p-4">
              <p className="text-xs text-ink/50">To: {preview.to}</p>
              <p className="mt-1 font-semibold text-ink">{preview.subject}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">{preview.text}</p>
              <p className="mt-3 text-xs text-ink/45">
                Every message ends with a one-click unsubscribe link, and replies come to your support inbox.
              </p>
            </div>
          )}

          {result && <p className="rounded-md bg-cream px-3 py-2 text-sm text-ink/80">{result}</p>}

          <div className="flex items-center gap-3">
            <Button onClick={send} disabled={busy || disabled || !selected.length || overCap}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {busy ? "Sending…" : `Send to ${selected.length}`}
            </Button>
            <p className="text-xs text-ink/50">
              Sent one at a time, a moment apart, so the mail is not treated as a burst.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
