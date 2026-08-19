"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Loader2 } from "lucide-react";
import { setMode } from "@/app/dashboard/(panel)/sandbox/actions";
import type { DataMode } from "@/lib/sandbox";
import { cn } from "@/lib/utils";

/**
 * Real / Test switch, shown only to admins.
 *
 * Which world an admin is looking at has to be obvious at a glance, so the
 * active side is filled in rather than merely outlined, and turning test mode
 * on also paints the banner and the frame around every screen.
 */
export function ModeSwitch({ mode }: { mode: DataMode }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const pick = (next: DataMode) => {
    if (next === mode || pending) return;
    start(async () => {
      await setMode(next);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-ink/15 bg-white p-0.5" role="group" aria-label="Data mode">
      <button
        type="button"
        onClick={() => pick("real")}
        aria-pressed={mode === "real"}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-semibold transition",
          mode === "real" ? "bg-ink text-cream" : "text-ink/60 hover:text-ink"
        )}
      >
        Real
      </button>
      <button
        type="button"
        onClick={() => pick("test")}
        aria-pressed={mode === "test"}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
          mode === "test" ? "bg-amber-500 text-white" : "text-ink/60 hover:text-ink"
        )}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
        Test
      </button>
    </div>
  );
}

/**
 * The persistent reminder that nothing on screen is real. Deliberately loud,
 * and deliberately on every admin screen rather than only the sandbox page.
 */
export function TestModeFrame() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[60] border-[6px] border-amber-500/90" aria-hidden="true" />
      <div className="sticky top-0 z-[61] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-bold text-white">
        <FlaskConical className="h-4 w-4 shrink-0" />
        Test mode: everything here is sandbox data. No real orders, payments or customers.
      </div>
    </>
  );
}
