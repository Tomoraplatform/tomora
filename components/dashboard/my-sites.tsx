"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, ArrowRight, CircleDot, Loader2, ShoppingBag, Check, Package, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setCurrentSite, editSite, deleteSite } from "@/app/dashboard/(panel)/templates/actions";

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
  productCount?: number;
  orderCount?: number;
}

export function MySites({ sites }: { sites: MySite[] }) {
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Deleting a site cascades to its products, orders, donations, reviews and
   * leads, so the confirmation spells out exactly what goes with it rather
   * than asking a vague "are you sure".
   */
  async function remove(s: MySite) {
    const losses: string[] = [];
    if (s.productCount) losses.push(`${s.productCount} product${s.productCount === 1 ? "" : "s"}`);
    if (s.orderCount) losses.push(`${s.orderCount} order${s.orderCount === 1 ? "" : "s"} and their records`);
    const detail = losses.length ? `\n\nThis also deletes ${losses.join(" and ")}.` : "";
    if (!confirm(`Delete "${s.name}"?${detail}\n\nThe website goes offline immediately and this cannot be undone.`)) return;

    setRemoving(s.id);
    setError(null);
    const res = await deleteSite(s.id);
    setRemoving(null);
    if (res.ok) window.location.reload();
    else setError(res.error || "Could not delete this website.");
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Your Websites ({sites.length})
        </h2>
        <Button asChild size="sm" variant="outline"><Link href="/dashboard/templates">Add website <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

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
                {s.isEcommerce && (
                  <div className="mt-2 flex items-center gap-4 text-xs text-ink/60">
                    <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {s.productCount ?? 0} products</span>
                    <span className="inline-flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" /> {s.orderCount ?? 0} orders</span>
                  </div>
                )}
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
              <button
                type="button"
                onClick={() => remove(s)}
                disabled={removing === s.id}
                title={`Delete ${s.name}`}
                aria-label={`Delete ${s.name}`}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-ink/40 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                {removing === s.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
