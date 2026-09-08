"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { formatNaira } from "@/lib/utils";

export type DonationState = {
  enabled: boolean;
  raised: number;
  goal: number;
  count: number;
  canDonate: boolean;
  /** Totals per fundraising project, keyed by project id (raised = online + offline manual). */
  projects: Record<string, { raised: number; count: number; manual?: number; manualCount?: number }>;
  /** Paid gifts belonging to no current project, so nothing is ever hidden. */
  unassigned: { raised: number; count: number };
  refresh: () => void;
};

const DonationContext = createContext<DonationState>({
  enabled: false, raised: 0, goal: 0, count: 0, canDonate: false,
  projects: {}, unassigned: { raised: 0, count: 0 }, refresh: () => {},
});

export function useDonation() {
  return useContext(DonationContext);
}

/**
 * Shares the live fundraising total across a template so the hero figure and
 * the donation section stay in sync. On the published site it polls
 * /api/donations/total; in the editor/preview (no siteId) it just reflects the
 * manually-added amount. `refresh()` is called after a successful donation.
 */
export function DonationProvider({
  siteId, enabled, goal, manual, children,
}: {
  siteId?: string;
  enabled: boolean;
  goal: number;
  manual: number;
  children: React.ReactNode;
}) {
  // Online (Paystack) sum comes from the server; the manual/offline amount and
  // the goal come from the live site data (props), so editing them in the
  // editor updates the hero figure and progress bar immediately.
  const [online, setOnline] = useState(0);
  const [count, setCount] = useState(0);
  const [canDonate, setCanDonate] = useState(false);
  const [projects, setProjects] = useState<Record<string, { raised: number; count: number; manual?: number; manualCount?: number }>>({});
  const [unassigned, setUnassigned] = useState({ raised: 0, count: 0 });

  // The number of gifts last seen, so a poll can tell when a new one lands.
  const countRef = useRef(0);

  const readTotals = useCallback(async (): Promise<number | null> => {
    if (!siteId || !enabled) return null;
    try {
      // no-store: this is read again seconds after a payment, and a cached copy
      // would be the total from before the gift.
      const res = await fetch(`/api/donations/total?siteId=${siteId}`, { cache: "no-store" });
      const d = await res.json();
      if (typeof d.online === "number") setOnline(d.online);
      else if (typeof d.raised === "number") setOnline(Math.max(0, d.raised - Math.max(0, Math.round(manual || 0))));
      const next = d.count || 0;
      setCount(next);
      setCanDonate(!!d.canDonate);
      setProjects(d.projects || {});
      setUnassigned(d.unassigned || { raised: 0, count: 0 });
      countRef.current = next;
      return next;
    } catch {
      return null;
    }
    // manual intentionally excluded, it's applied live from props below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, enabled]);

  /**
   * Reads the total again until the new gift shows up.
   *
   * A donation is settled by whichever of three paths arrives first: this
   * browser's confirm call, Paystack's webhook, or the reconcile pass. The
   * confirm call can return before the row is paid, because Paystack sometimes
   * needs a moment to verify the charge and the endpoint answers "not confirmed
   * yet" rather than waiting. Reading the total once at that point shows the
   * figure from before the donation, which is what a donor notices: they gave,
   * and the bar did not move.
   *
   * So poll briefly and stop as soon as the count rises.
   */
  const refresh = useCallback(async () => {
    const before = countRef.current;
    for (const wait of [0, 1500, 3000, 5000, 8000, 12000]) {
      if (wait) await new Promise((r) => setTimeout(r, wait));
      const now = await readTotals();
      if (now !== null && now > before) return;
    }
  }, [readTotals]);

  useEffect(() => { readTotals(); }, [readTotals]);

  // A donor who paid on a Paystack redirect comes back to this tab rather than
  // finishing in a popup, so the gift may have settled while the page was
  // hidden. Read once on return.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") readTotals(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [readTotals]);

  const raised = Math.max(0, Math.round(manual || 0)) + online;

  return (
    <DonationContext.Provider value={{ enabled, raised, goal: Math.max(0, Math.round(goal || 0)), count, canDonate, projects, unassigned, refresh }}>
      {children}
    </DonationContext.Provider>
  );
}

/**
 * The hero "Donation so far" + "Target" cards. Reads the live total from the
 * donation context; renders nothing when donations are off. `tone` adapts the
 * card colours to a light or dark hero.
 */
export function HeroDonation({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { enabled, raised, goal } = useDonation();
  if (!enabled) return null;
  const dark = tone === "dark";
  const card = dark ? "border-white/25 bg-white/10 text-white" : "border-black/10 bg-white text-neutral-900 shadow-sm";
  const label = dark ? "text-white/60" : "text-black/45";
  return (
    <div className="flex flex-wrap gap-3">
      <div className={`min-w-[130px] rounded-xl border px-4 py-3 ${card}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-wide ${label}`}>Donation so far</p>
        <p className="mt-0.5 text-2xl font-bold">{formatNaira(raised)}</p>
      </div>
      {goal > 0 && (
        <div className={`min-w-[130px] rounded-xl border px-4 py-3 ${card}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${label}`}>Target</p>
          <p className="mt-0.5 text-2xl font-bold">{formatNaira(goal)}</p>
        </div>
      )}
    </div>
  );
}
