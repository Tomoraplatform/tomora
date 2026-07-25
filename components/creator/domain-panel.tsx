"use client";

import { useState } from "react";
import { Loader2, Search, Globe, Check, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { buyCreatorDomain } from "@/app/academy/sell/domain-actions";

type Result = { domain: string; available: boolean; amount: number };

/**
 * Lets a creator search for a custom domain for their sales pages and pay for
 * it, exactly like the site domain flow. Tomora registers and connects it.
 */
export function DomainPanel({ creatorSlug, customDomain, requests, appDomain }: {
  creatorSlug: string;
  customDomain: string | null;
  requests: { id: string; domain: string; status: string; createdAt: string }[];
  appDomain: string;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    const q = query.trim();
    if (q.length < 2) { setError("Enter at least 2 characters."); return; }
    setSearching(true); setError(null); setResults(null);
    try {
      const res = await fetch(`/api/domain/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not check that name.");
      setResults(data.results || []);
    } catch (e: any) { setError(e.message); }
    finally { setSearching(false); }
  }

  async function buy(domain: string) {
    setBusy(domain); setError(null);
    const res = await buyCreatorDomain(domain);
    setBusy(null);
    if (!res.ok) { setError(res.error || "Could not start payment."); return; }
    if (res.url) window.location.href = res.url;
  }

  const pending = requests.filter((r) => r.status !== "cancelled" && r.status !== "connected");

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-ink/60">
          Your pages are live at <span className="font-medium text-ink">{appDomain}/c/{creatorSlug}</span>.
          Get your own domain for a more professional link.
        </p>

        {customDomain && (
          <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" /> Connected: {customDomain}
          </p>
        )}

        {pending.length > 0 && (
          <div className="space-y-1.5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {pending.map((r) => (
              <p key={r.id} className="inline-flex items-center gap-2">
                <CircleAlert className="h-4 w-4 shrink-0" />
                {r.domain} · {r.status === "paid" ? "paid, we're registering it" : "registered, connecting it now"}
              </p>
            ))}
          </div>
        )}

        {!customDomain && (
          <>
            <div className="flex flex-wrap gap-2">
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setResults(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") search(); }}
                placeholder="yourname"
                className="w-full sm:w-64"
              />
              <Button variant="outline" onClick={search} disabled={searching || query.trim().length < 2}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Check
              </Button>
            </div>

            {results && (
              <div className="divide-y divide-ink/5 rounded-lg border border-ink/10 bg-white">
                {results.map((r) => (
                  <div key={r.domain} className="flex flex-wrap items-center gap-3 px-3 py-3">
                    <Globe className="h-4 w-4 shrink-0 text-ink/40" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{r.domain}</span>
                    {r.available ? (
                      <>
                        <span className="text-sm text-ink/60">{formatNaira(r.amount)}/year</span>
                        <Button size="sm" onClick={() => buy(r.domain)} disabled={busy === r.domain}>
                          {busy === r.domain ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Get it
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-ink/45">Taken</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-ink/50">Price shown excludes 7.5% VAT, added at checkout. We register and connect it for you.</p>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
