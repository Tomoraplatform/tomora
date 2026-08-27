"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, MessageCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";
import { activateLive, pauseLive, saveGreeting } from "@/app/dashboard/(panel)/live/actions";

/**
 * The seller's whole relationship with Tomora Live: switch it on, get the link
 * to share, and change the greeting. Everything else runs itself.
 */
export function LiveManager({
  hasSite, active, activated, storeCode, greeting: initialGreeting, link, connected, number, commission, stats,
}: {
  hasSite: boolean;
  active: boolean;
  activated: boolean;
  storeCode: string | null;
  greeting: string;
  link: string | null;
  /** Whether Tomora's own WhatsApp connection is live yet. */
  connected: boolean;
  number: string;
  commission: number;
  stats: { orders: number; revenue: number };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(initialGreeting);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) { setError(res.error || "Something went wrong."); return; }
      after?.();
      router.refresh();
    });
  };

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the link and copy it by hand.");
    }
  }

  if (!hasSite) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-ink/70">
          Create your store and add a few products first. Tomora Live sells the products you already
          have, so there is nothing for it to show yet.
        </CardContent>
      </Card>
    );
  }

  if (!activated) {
    return (
      <Card>
        <CardHeader><CardTitle>Turn on Tomora Live</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-ink/75">
            {[
              "Customers browse your products and check out inside WhatsApp",
              "Orders land in your existing Orders page, exactly like website orders",
              "Order updates are sent to the customer automatically as you fulfil them",
              `Free to use. Tomora takes ${commission}% of each WhatsApp sale, and nothing else`,
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={() => run(activateLive)} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            Activate Tomora Live
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!connected && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tomora Live is on for your store, but Tomora&apos;s WhatsApp connection is still being set
          up. Your link will start working as soon as that is finished. Nothing for you to do.
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Your WhatsApp shop</CardTitle>
          <Badge variant={active ? "success" : "secondary"}>{active ? "Taking orders" : "Paused"}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Share this link</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2 text-sm">
                {link}
              </code>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-ink/50">
              Put it in your Instagram bio, your status, or anywhere customers find you. Anyone who
              taps it opens a chat with your shop already loaded.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Store code" value={storeCode || "-"} hint="Customers can type this instead" />
            <Stat label="WhatsApp number" value={number ? `+${number}` : "Being set up"} hint="The number customers message" />
            <Stat label="WhatsApp orders" value={String(stats.orders)} hint="Paid and beyond" />
            <Stat label="WhatsApp sales" value={formatNaira(stats.revenue)} hint={`Before the ${commission}% fee`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Welcome message</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink/60">
            The first thing a customer reads when they open your shop. Leave it empty for the default.
          </p>
          <Textarea
            rows={3}
            value={greeting}
            maxLength={500}
            placeholder="Welcome to our shop! Browse below and we'll deliver same day within Lagos."
            onChange={(e) => { setGreeting(e.target.value); setSaved(false); }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" disabled={pending} onClick={() => run(() => saveGreeting(greeting), () => setSaved(true))}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save message
            </Button>
            {saved && <span className="text-sm text-emerald-700">Saved</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{active ? "Pause Tomora Live" : "Resume Tomora Live"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink/60">
            {active
              ? "Customers who open your shop will be told you are not taking orders right now. Your link and store code are kept."
              : "Start taking WhatsApp orders again on the same link."}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button variant="outline" disabled={pending} onClick={() => run(() => pauseLive(active))}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {active ? "Pause" : "Resume"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-ink/10 p-3">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-0.5 truncate font-semibold text-ink">{value}</p>
      <p className="mt-0.5 truncate text-xs text-ink/40">{hint}</p>
    </div>
  );
}
