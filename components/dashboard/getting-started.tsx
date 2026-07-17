"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, X, Rocket } from "lucide-react";

export interface SetupStep {
  key: string;
  label: string;
  desc: string;
  done: boolean;
  href: string;
  cta: string;
}

export function GettingStarted({ steps, siteId }: { steps: SetupStep[]; siteId: string }) {
  const storageKey = `tomora_gs_hidden_${siteId}`;
  const [hidden, setHidden] = useState(true); // default hidden to avoid flash before we read storage
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = done === total;
  const pct = Math.round((done / total) * 100);

  useEffect(() => {
    setHidden(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  function hide() {
    localStorage.setItem(storageKey, "1");
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-cream"><Rocket className="h-4 w-4" /></span>
          <div>
            <h2 className="text-lg font-bold text-ink">{allDone ? "Your store is ready!" : "Get your store ready"}</h2>
            <p className="text-sm text-ink/60">{allDone ? "You've completed every setup step." : `${done} of ${total} steps done, finish these to start selling.`}</p>
          </div>
        </div>
        <button onClick={hide} className="text-ink/40 hover:text-ink" aria-label="Hide checklist"><X className="h-5 w-5" /></button>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-4 divide-y divide-ink/5">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-3 py-3">
            {s.done
              ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              : <Circle className="h-5 w-5 shrink-0 text-ink/25" />}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${s.done ? "text-ink/50 line-through" : "text-ink"}`}>{s.label}</p>
              {!s.done && <p className="text-xs text-ink/50">{s.desc}</p>}
            </div>
            {!s.done && (
              <Link href={s.href} className="flex shrink-0 items-center gap-1 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-cream hover:opacity-90">
                {s.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </li>
        ))}
      </ul>

      {allDone && (
        <button onClick={hide} className="mt-2 text-sm font-medium text-ink/60 underline hover:text-ink">Dismiss</button>
      )}
    </div>
  );
}
