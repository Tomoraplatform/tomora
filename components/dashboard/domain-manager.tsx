"use client";

import { useState } from "react";
import { Globe, Loader2, CheckCircle2, Trash2, ShoppingCart, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { removeDomain, activateIncludedDomain, changeSubdomain } from "@/app/dashboard/(panel)/domain/actions";
import { formatNaira, slugifySubdomain } from "@/lib/utils";
import type { DomainStatus, DomainRequest } from "@/lib/database.types";

export function DomainManager({
  initialDomain, initialStatus, included, newDomainAmount, requests = [], siteId, subdomain, appDomain,
}: {
  initialDomain: string | null;
  initialStatus: DomainStatus;
  included: boolean;
  newDomainAmount: number;
  requests?: DomainRequest[];
  siteId: string;
  subdomain: string;
  appDomain: string;
}) {
  const [domain, setDomain] = useState(initialDomain || "");
  const [status, setStatus] = useState<DomainStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);

  // Assisted "buy a new domain" search state.
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<{ domain: string; available: boolean; amount: number }[] | null>(null);
  const [buyingDomain, setBuyingDomain] = useState<string | null>(null);

  const connected = status !== "none" && !!domain;
  const hasPendingRequest = requests.some((r) => r.status === "paid" || r.status === "registered");
  // A new domain is free when the plan includes one and the site has no domain
  // or pending request yet. Growth/Pro primary site.
  const freeNewDomain = included && !initialDomain && !hasPendingRequest;

  async function search() {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true); setError(null); setResults(null);
    try {
      const res = await fetch(`/api/domain/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not search.");
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }

  async function getDomain(name: string) {
    setBuyingDomain(name); setError(null);
    try {
      // Included in the plan → activate for free, no Paystack.
      if (freeNewDomain) {
        const res = await activateIncludedDomain(name);
        if (!res.ok) throw new Error(res.error || "Could not activate domain.");
        window.location.href = "/dashboard/domain?status=requested";
        return;
      }
      const res = await fetch("/api/billing/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "new_domain", siteId, domain: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment.");
      window.location.href = data.authorization_url;
    } catch (e: any) {
      setError(e.message); setBuyingDomain(null);
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect this domain? You'll keep using your Tomora subdomain.")) return;
    await removeDomain();
    setDomain(""); setStatus("none");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Custom Domain</h1>
        <p className="mt-1 text-ink/60">Get your own domain to use instead of your Tomora subdomain.</p>
      </div>

      <SubdomainCard initial={subdomain} appDomain={appDomain} />

      {/* Connected custom domain */}
      {connected && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex min-w-0 items-center gap-2"><span className="truncate">{domain}</span></CardTitle>
            <Badge variant={status === "active" ? "success" : "warning"} className="shrink-0">
              {status === "active" ? "Active" : "Setting up"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "active" ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" /> Your domain is connected and live.
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                <Clock className="h-5 w-5 shrink-0" /> We&apos;re setting up your domain. It will go live shortly.
              </div>
            )}
            <button onClick={disconnect} className="flex items-center gap-1.5 text-sm text-destructive hover:underline">
              <Trash2 className="h-4 w-4" /> Disconnect domain
            </button>
          </CardContent>
        </Card>
      )}

      {/* Pending assisted-domain requests */}
      {requests.filter((r) => r.status === "paid" || r.status === "registered").map((r) => (
        <Card key={r.id} className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-start gap-3 p-5">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-ink break-all">{r.domain}</p>
              <p className="mt-0.5 text-ink/60">
                {r.status === "paid"
                  ? "We've received this and are registering your domain. It will be connected to your site shortly (usually within 24 hours)."
                  : "Registered, we're connecting it to your site now."}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Get a new domain (the only way to add a custom domain) */}
      {!connected && !hasPendingRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="h-4 w-4" /> Get a custom domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-ink/60">
              {freeNewDomain ? (
                <>Your plan includes a domain, search for a <span className="font-medium text-ink">.com.ng</span> name and activate it <span className="font-medium text-emerald-700">free</span>. We register it and connect it for you.</>
              ) : (
                <>Search for a <span className="font-medium text-ink">.com.ng</span> domain and activate it for a one-time {formatNaira(newDomainAmount)}. We register it and connect it to your site for you.</>
              )}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="yourbrand"
              />
              <Button onClick={search} disabled={searching} className="shrink-0">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
              </Button>
            </div>

            {results && results.length > 0 && (
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.domain} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{r.domain}</p>
                      <p className={`text-xs ${r.available ? "text-emerald-600" : "text-ink/40"}`}>
                        {r.available ? (freeNewDomain ? "Available · included in your plan" : `Available · ${formatNaira(r.amount)}`) : "Taken"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      disabled={!r.available || buyingDomain === r.domain}
                      onClick={() => getDomain(r.domain)}
                    >
                      {buyingDomain === r.domain ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                      {freeNewDomain ? "Activate free" : "Buy & activate"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {results && results.length === 0 && <p className="text-sm text-ink/50">No results. Try another name.</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * The free Tomora address, editable at any time. Owners outgrow the name they
 * signed up with, or want to drop the digits added to make it unique, and it
 * should not take a support request to change it after going live.
 */
function SubdomainCard({ initial, appDomain }: { initial: string; appDomain: string }) {
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The same tidy-up the server applies, so the address previewed here is
  // exactly the one that gets saved.
  const clean = slugifySubdomain(value);
  const changed = clean !== saved;
  const tooShort = clean.length < 3;

  async function save() {
    setBusy(true); setError(null); setDone(false);
    const res = await changeSubdomain(clean);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Could not save."); return; }
    setSaved(res.subdomain || clean);
    setValue(res.subdomain || clean);
    setDone(true);
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 shrink-0 text-ink/50" />
          <p className="text-sm text-ink/60">Your free web address</p>
          <Badge variant="success" className="ml-auto shrink-0">Active</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:flex-none">
            <Input
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); setDone(false); }}
              onKeyDown={(e) => { if (e.key === "Enter" && changed && !busy) save(); }}
              aria-label="Your web address"
              className="w-full min-w-0 sm:w-48"
              placeholder="your-brand"
            />
            <span className="shrink-0 text-sm text-ink/60">.{appDomain}</span>
          </div>
          <Button onClick={save} disabled={busy || !changed || tooShort} className="shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save address
          </Button>
        </div>

        {changed && tooShort ? (
          <p className="text-xs text-ink/60">
            Use at least 3 characters: letters, numbers and dashes.
          </p>
        ) : changed ? (
          <p className="text-xs text-ink/60">
            Your site will answer at{" "}
            <span className="font-semibold text-ink">{clean}.{appDomain}</span>. The old address
            stops working, so update it anywhere you have shared it.
          </p>
        ) : (
          <a
            href={`https://${saved}.${appDomain}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block truncate text-sm font-medium text-ink underline"
          >
            {saved}.{appDomain}
          </a>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {done && (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Saved. Your site is now at {saved}.{appDomain}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
