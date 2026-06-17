"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import type { Student } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { UserPlus, Loader2, Send, CheckCircle2 } from "lucide-react";

export function AdminStudents({
  students,
  completedByStudent,
  totalLessons,
}: {
  students: Student[];
  completedByStudent: Record<string, number>;
  totalLessons: number;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [sendLink, setSendLink] = useState(true);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<Record<string, string>>({});

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, sendLink }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({
          tone: "success",
          text: sendLink
            ? "Student added and access link sent."
            : "Student added and approved.",
        });
        setFullName("");
        setEmail("");
        router.refresh();
      } else {
        setMsg({ tone: "error", text: data.message || "Could not add student." });
      }
    } catch {
      setMsg({ tone: "error", text: "Something went wrong. Please try again." });
    } finally {
      setAdding(false);
    }
  }

  async function resend(student: Student) {
    setResendingId(student.id);
    setRowMsg((m) => ({ ...m, [student.id]: "" }));
    try {
      const res = await fetch("/api/admin/resend-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: student.email }),
      });
      const data = await res.json();
      setRowMsg((m) => ({
        ...m,
        [student.id]: data.ok ? "Link sent ✓" : data.message || "Failed",
      }));
    } catch {
      setRowMsg((m) => ({ ...m, [student.id]: "Failed" }));
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div className="space-y-7">
      {/* Add student (manual enrollment backup) */}
      <Card>
        <CardBody>
          <CardTitle>Add a student manually</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Backup enrollment if payment automation fails. The student is marked
            approved immediately.
          </p>
          <form
            onSubmit={addStudent}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <div>
              <Label htmlFor="sname">Full name</Label>
              <Input
                id="sname"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Obi"
                disabled={adding}
              />
            </div>
            <div>
              <Label htmlFor="semail">Email address</Label>
              <Input
                id="semail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@email.com"
                disabled={adding}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-charcoal sm:col-span-2">
              <input
                type="checkbox"
                checked={sendLink}
                onChange={(e) => setSendLink(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Send the magic-link access email now
            </label>
            {msg && (
              <div className="sm:col-span-2">
                <Alert tone={msg.tone}>{msg.text}</Alert>
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={adding}>
                {adding ? (
                  <>
                    <Loader2 className="animate-spin" size={17} /> Adding…
                  </>
                ) : (
                  <>
                    <UserPlus size={17} /> Add student
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Student list */}
      <Card>
        <CardBody>
          <CardTitle>All students ({students.length})</CardTitle>
          {students.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-line bg-surface-warm p-8 text-center text-sm text-muted">
              No students yet. Add one above or wait for a paid enrollment.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="pb-3 pr-4 font-semibold">Student</th>
                    <th className="pb-3 pr-4 font-semibold">Status</th>
                    <th className="pb-3 pr-4 font-semibold">Payment</th>
                    <th className="pb-3 pr-4 font-semibold">Progress</th>
                    <th className="pb-3 pr-4 font-semibold">Joined</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {students.map((s) => {
                    const done = completedByStudent[s.id] || 0;
                    const pct =
                      totalLessons === 0
                        ? 0
                        : Math.round((done / totalLessons) * 100);
                    return (
                      <tr key={s.id} className="align-middle">
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-charcoal">
                            {s.full_name}
                          </p>
                          <p className="text-xs text-muted">{s.email}</p>
                        </td>
                        <td className="py-3 pr-4">
                          {s.approved_status ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <CheckCircle2 size={14} /> Approved
                            </span>
                          ) : (
                            <span className="text-muted">Pending</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 capitalize text-muted">
                          {s.payment_status}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={pct} className="w-24" />
                            <span className="text-xs text-muted">
                              {done}/{totalLessons}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-muted">
                          {formatDate(s.created_at)}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => resend(s)}
                            disabled={resendingId === s.id || !s.approved_status}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent-soft disabled:opacity-50"
                          >
                            {resendingId === s.id ? (
                              <Loader2 className="animate-spin" size={13} />
                            ) : (
                              <Send size={13} />
                            )}
                            Resend link
                          </button>
                          {rowMsg[s.id] && (
                            <p className="mt-1 text-xs text-muted">
                              {rowMsg[s.id]}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
