"use client";

import { useState } from "react";
import { Loader2, BellRing, Check, Clock } from "lucide-react";
import { notifyMe } from "@/app/academy/actions";

/**
 * Replaces the purchase button on a coming-soon course: students drop their
 * email and get notified when the course opens.
 */
export function NotifyButton({ courseId, defaultEmail = "", className = "" }: {
  courseId: string;
  defaultEmail?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await notifyMe(courseId, email);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Something went wrong."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className={`flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 ${className}`}>
        <Check className="h-4 w-4" /> You&apos;re on the list. We&apos;ll email you at launch.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 ${className}`}
      >
        <Clock className="h-4 w-4" /> Coming soon · Notify me
      </button>
    );
  }

  return (
    <form onSubmit={submit} className={`w-full space-y-1.5 ${className}`}>
      <p className="text-xs font-medium text-ink/60">This course is coming soon. Drop your email and we&apos;ll notify you the moment it opens.</p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="min-w-0 flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm focus:border-ink/40 focus:outline-none"
        />
        <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-cream disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />} Notify me
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
