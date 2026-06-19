"use client";

import { useTransition } from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { setCurrentSite } from "@/app/dashboard/(panel)/templates/actions";

export interface SwitcherSite {
  id: string;
  label: string;
}

export function SiteSwitcher({ sites, currentId }: { sites: SwitcherSite[]; currentId: string }) {
  const [pending, startTransition] = useTransition();
  if (sites.length < 2) return null;

  return (
    <div className="px-3 pb-2">
      <label className="relative block">
        <select
          value={currentId}
          disabled={pending}
          onChange={(e) => {
            const id = e.target.value;
            if (id !== currentId) startTransition(() => { setCurrentSite(id); });
          }}
          className="w-full appearance-none rounded-lg border border-ink/15 bg-cream/50 py-2 pl-3 pr-8 text-sm font-medium text-ink"
        >
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink/40">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsUpDown className="h-4 w-4" />}
        </span>
      </label>
    </div>
  );
}
