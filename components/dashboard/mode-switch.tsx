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
