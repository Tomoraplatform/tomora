"use client";

import { useEffect, useState } from "react";
import { Globe, Loader2, CheckCircle2, Copy, RefreshCw, Trash2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { connectDomain, removeDomain } from "@/app/dashboard/(panel)/domain/actions";
import { formatNaira } from "@/lib/utils";
import type { DomainStatus } from "@/lib/database.types";

export function DomainManager({
  initialDomain, initialStatus, canConnect, included, domainPurchased, extraDomainAmount, siteId, subdomain, appDomain,
}: {
  initialDomain: string | null;
  initialStatus: DomainStatus;
  canConnect: boolean;
  included: boolean;
  domainPurchased: boolean;
  extraDomainAmount: number;
  siteId: string;
  subdomain: string;
  appDomain: string;
}) {
  const [domain, setDomain] = useState(initialDomain || "");
  const [status, setStatus] = useState<DomainStatus>(initialStatus);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = `cname.${appDomain}`;

  useEffect(() => {
    if (status !== "pending" && status !== "verifying") return;
    const id = setInterval(async () => {
      const res = await fetch("/api/domain/verify", { method: "POST" });
      const data = await res.json();
      if (data.status) setStatus(data.status);
    }, 6000);
    return () => clearInterval(id);
  }, [status]);

  async function connect() {
    setBusy(true); setError(null);
    const res = await connectDomain(input);
    setBusy(false);
    if (res.ok) { setDomain(input.trim().toLowerCase()); setStatus("pending"); }
    else setError(res.error || "Could not connect domain.");
  }

  async function buyDomain() {
    setBuying(true); setError(null);
    try {
      const res = await fetch("/api/billing/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "domain", siteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment.");
      window.location.href = data.authorization_url;
    } catch (e: any) {
      setError(e.message); setBuying(false);
    }
  }

  async function recheck() {
    setBusy(true);
    const res = await fetch("/api/domain/verify", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (data.status) setStatus(data.status);
  }

  async function disconnect() {
    if (!confirm("Disconnect this domain?")) return;
    await removeDomain();
    setDomain(""); setStatus("none"); setInput("");
  }

  const connected = status !== "none" && domain;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Custom Domain</h1>
        <p className="mt-1 text-ink/60">Use your own domain instead of your Tomora subdomain.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <Globe className="h-5 w-5 text-ink/50" />
          <div>
            <p className="text-sm text-ink/60">Your free subdomain</p>
            <p className="font-medium text-ink">{subdomain}.{appDomain}</p>
          </div>
          <Badge variant="success" className="ml-auto">Active</Badge>
        </CardContent>
      </Card>

      {!canConnect ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5"><Globe className="h-6 w-6 text-ink/50" /></span>
            <p className="font-medium text-ink">Connect a custom domain to this site</p>
            <p className="max-w-sm text-sm text-ink/60">
              Add a custom domain (like yourbrand.com) for a one-time {formatNaira(extraDomainAmount)},
              or move to a plan that includes a domain.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <Button onClick={buyDomain} disabled={buying}>
                {buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                Buy custom domain — {formatNaira(extraDomainAmount)}
              </Button>
              <Button asChild variant="outline"><Link href="/dashboard/billing">See plans</Link></Button>
            </div>
          </CardContent>
        </Card>
      ) : !connected ? (
        <Card>
          <CardHeader><CardTitle>Connect a domain</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(included || domainPurchased) && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> {included ? "A custom domain is included on your plan." : "Domain add-on purchased."}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="yourbrand.com" />
              <Button onClick={connect} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Connect</Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">{domain}</CardTitle>
            <Badge variant={status === "active" ? "success" : "warning"}>
              {status === "active" ? "Active" : status === "verifying" ? "Verifying" : "Pending DNS"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "active" ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="h-5 w-5" /> Your domain is connected and live.
              </div>
            ) : (
              <>
                <p className="text-sm text-ink/70">Add this DNS record at your domain registrar, then we&apos;ll verify automatically:</p>
                <div className="overflow-hidden rounded-lg border border-ink/10">
                  <DnsRow label="Type" value="CNAME" />
                  <DnsRow label="Name / Host" value="www" />
                  <DnsRow label="Value / Target" value={target} copy />
                </div>
                <p className="text-xs text-ink/50">For a root domain (yourbrand.com), use an ALIAS/ANAME record to {target}, or an A record per your registrar&apos;s instructions.</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={recheck} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Check now
                  </Button>
                  <span className="text-xs text-ink/40">Checking automatically every few seconds…</span>
                </div>
              </>
            )}
            <button onClick={disconnect} className="flex items-center gap-1.5 text-sm text-destructive hover:underline">
              <Trash2 className="h-4 w-4" /> Disconnect domain
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DnsRow({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between border-b border-ink/5 px-4 py-2.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-ink/50">{label}</span>
      <span className="flex items-center gap-2 font-mono text-sm text-ink">
        {value}
        {copy && (
          <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-ink/40" />}
          </button>
        )}
      </span>
    </div>
  );
}
