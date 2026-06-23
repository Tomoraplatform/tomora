"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, ArrowRight, CircleDot, Loader2, ShoppingBag, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setCurrentSite, editSite } from "@/app/dashboard/(panel)/templates/actions";

export interface MySite {
  id: string;
  name: string;
  templateName: string;
  accent: string;
  isLive: boolean;
  isEcommerce: boolean;
  isCurrent: boolean;
  liveUrl: string;
  liveHost: string;
}

export function MySites({ sites }: { sites: MySite[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Your Websites ({sites.length})
        </h2>
        <Button asChild size="sm" variant="outline"><Link href="/dashboard/templates">Add website <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sites.map((s) => (
          <div
            key={s.id}
            className={`relative rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${s.isCurrent ? "border-ink/40 ring-1 ring-ink/20" : "border-ink/10"}`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-9 w-9 shrink-0 rounded-lg" style={{ background: s.accent }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-ink">{s.name}</p>
                  {s.isCurrent && <span className="inline-flex items-center gap-1 text-xs font-medium text-ink/50"><Check className="h-3 w-3" /> Active</span>}
                </div>
                <p className="truncate text-sm text-ink/60">{s.templateName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={s.isLive ? "success" : "secondary"}>
                    <CircleDot className="mr-1 h-3 w-3" /> {s.isLive ? "Live" : "Draft"}
                  </Badge>
                  {s.isEcommerce && (
                    <Badge variant="secondary"><ShoppingBag className="mr-1 h-3 w-3" /> Store</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {s.isCurrent ? (
                <Button asChild size="sm"><Link href="/dashboard/editor"><Pencil className="h-4 w-4" /> Edit</Link></Button>
              ) : (
                <Button size="sm" disabled={pending} onClick={() => startTransition(() => { editSite(s.id); })}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />} Edit
                </Button>
              )}
              {!s.isCurrent && (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(() => { setCurrentSite(s.id); })}>
                  Open dashboard
                </Button>
              )}
              {s.isLive && (
                <Button asChild size="sm" variant="outline"><a href={s.liveUrl} target="_blank" rel="noreferrer">View <ExternalLink className="h-3.5 w-3.5" /></a></Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
