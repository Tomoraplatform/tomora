"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";

export type DonationState = {
  enabled: boolean;
  raised: number;
  goal: number;
  count: number;
  canDonate: boolean;
  /** Paid online totals per fundraising project, keyed by project id. */
  projects: Record<string, { raised: number; count: number }>;
  refresh: () => void;
};

const DonationContext = createContext<DonationState>({
  enabled: false, raised: 0, goal: 0, count: 0, canDonate: false, projects: {}, refresh: () => {},
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
  const [projects, setProjects] = useState<Record<string, { raised: number; count: number }>>({});

  const refresh = useCallback(async () => {
    if (!siteId || !enabled) return;
    try {
      const res = await fetch(`/api/donations/total?siteId=${siteId}`);
      const d = await res.json();
      if (typeof d.online === "number") setOnline(d.online);
      else if (typeof d.raised === "number") setOnline(Math.max(0, d.raised - Math.max(0, Math.round(manual || 0))));
      setCount(d.count || 0);
      setCanDonate(!!d.canDonate);
      setProjects(d.projects || {});
    } catch { /* ignore */ }
    // manual intentionally excluded, it's applied live from props below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  const raised = Math.max(0, Math.round(manual || 0)) + online;

  return (
    <DonationContext.Provider value={{ enabled, raised, goal: Math.max(0, Math.round(goal || 0)), count, canDonate, projects, refresh }}>
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
