"use client";

import { useState } from "react";

/**
 * A network test a customer can run from their own phone, on their own line.
 *
 * Every complaint we have says "MTN is slow", which is not something we can act
 * on: slow reaching what, from where, and how slow compared to Glo on the same
 * street? This page answers that in about fifteen seconds, without the person
 * needing to install anything or read a number off a terminal.
 *
 * Each test is deliberately one kind of work:
 *   ping     - a few bytes from the CDN edge, so it is almost pure round trip.
 *   server   - a request the edge cannot answer, so it measures the trip to
 *              wherever the app actually runs.
 *   download - a quarter megabyte of incompressible bytes, so it measures
 *              throughput rather than compression.
 *   site     - optionally the person's own shop, which is the thing they are
 *              really complaining about.
 *
 * A request that never finishes is the most useful result of all, so every test
 * has its own deadline and reports "timed out" as an outcome rather than
 * hanging.
 */

const TIMEOUT_MS = 20000;
const RUNS = 3;

const NETWORKS = ["MTN", "Glo", "Airtel", "9mobile", "Starlink", "Wi-Fi / other"] as const;

type Outcome = { ms: number | null; note?: string };

interface Result {
  key: string;
  label: string;
  hint: string;
  runs: Outcome[];
  median: number | null;
  extra?: string;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.floor(sorted.length / 2)]);
}

/** One timed request. Returns null ms when it fails or runs out of time. */
async function timed(
  url: string,
  init: RequestInit & { mode?: RequestMode } = {}
): Promise<Outcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
    // Opaque (no-cors) responses cannot be read, but the bytes still arrived.
    if (init.mode !== "no-cors") await response.arrayBuffer();
    return { ms: Math.round(performance.now() - started) };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return { ms: null, note: aborted ? `timed out after ${TIMEOUT_MS / 1000}s` : "failed" };
  } finally {
    clearTimeout(timer);
  }
}

function connectionInfo(): string {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number; rtt?: number };
  };
  const c = nav.connection;
  if (!c) return "not reported by this browser";
  const parts = [
    c.effectiveType ? `type ${c.effectiveType}` : null,
    typeof c.downlink === "number" ? `about ${c.downlink} Mbps` : null,
    typeof c.rtt === "number" ? `${c.rtt}ms round trip` : null,
  ].filter(Boolean);
  return parts.join(", ") || "not reported by this browser";
}

export function NetcheckClient() {
  const [network, setNetwork] = useState<string>("");
  const [siteUrl, setSiteUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [edge, setEdge] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  async function run() {
    setRunning(true);
    setResults(null);
    setCopied(false);

    const collected: Result[] = [];

    const push = async (
      key: string,
      label: string,
      hint: string,
      make: () => Promise<Outcome>,
      extra?: string
    ) => {
      setStep(label);
      const runs: Outcome[] = [];
      for (let i = 0; i < RUNS; i++) runs.push(await make());
      const ok = runs.map((r) => r.ms).filter((ms): ms is number => ms !== null);
      collected.push({ key, label, hint, runs, median: median(ok), extra });
    };

    await push("ping", "Reaching the nearest server", "A few bytes, so this is mostly travel time", () =>
      timed(`/netcheck-ping.txt?cb=${Date.now()}-${Math.random()}`)
    );

    await push("server", "Asking Tomora for a fresh answer", "Goes all the way to where the app runs", () =>
      timed(`/api/netcheck?cb=${Date.now()}-${Math.random()}`)
    );

    await push(
      "download",
      "Downloading a quarter megabyte",
      "Roughly one photo's worth of data",
      () => timed(`/netcheck-256k.bin?cb=${Date.now()}-${Math.random()}`)
    );

    const trimmed = siteUrl.trim();
    if (trimmed) {
      const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      await push("site", "Opening your own website", "The page your customers complain about", () =>
        timed(`${url}${url.includes("?") ? "&" : "?"}cb=${Date.now()}`, { mode: "no-cors" })
      );
    }

    // What the edge saw of this visitor: which POP answered, which country and
    // city it placed them in. Best effort; the test stands without it.
    setStep("Finishing up");
    let edgeView: Record<string, unknown> | null = null;
    try {
      const response = await fetch(`/api/netcheck?cb=${Date.now()}`, { cache: "no-store" });
      const data = await response.json();
      edgeView = data?.edge ?? null;
    } catch {
      /* ignore */
    }

    const report = {
      network: network || "not said",
      connection: connectionInfo(),
      screen: `${window.screen.width}x${window.screen.height}`,
      results: collected.map((r) => ({
        test: r.key,
        median_ms: r.median,
        runs: r.runs.map((x) => x.ms ?? x.note ?? "failed"),
      })),
    };

    // Send it back so we can compare carriers without asking anyone to read
    // numbers over the phone. Failure here changes nothing on screen.
    try {
      await fetch("/api/netcheck", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(report),
        cache: "no-store",
      });
    } catch {
      /* ignore */
    }

    setEdge(edgeView);
    setResults(collected);
    setStep("");
    setRunning(false);
  }

  function copy() {
    if (!results) return;
    const lines = [
      `Tomora network check`,
      `Network: ${network || "not said"}`,
      `Connection: ${connectionInfo()}`,
      ...results.map(
        (r) =>
          `${r.label}: ${r.median === null ? "did not finish" : `${r.median}ms`} (${r.runs
            .map((x) => (x.ms === null ? x.note ?? "failed" : `${x.ms}ms`))
            .join(", ")})`
      ),
      edge ? `Served by: ${String(edge.city ?? "?")}, ${String(edge.country ?? "?")}` : "",
    ].filter(Boolean);
    navigator.clipboard?.writeText(lines.join("\n")).then(
      () => setCopied(true),
      () => setCopied(false)
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Network check</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This measures how fast your phone reaches Tomora right now. It takes about
        fifteen seconds and uses roughly one megabyte of data.
      </p>

      <label className="mt-6 block text-sm font-medium">Which network are you on?</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {NETWORKS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNetwork(n)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              network === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-accent"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <label className="mt-6 block text-sm font-medium" htmlFor="netcheck-site">
        Your website address (optional)
      </label>
      <input
        id="netcheck-site"
        value={siteUrl}
        onChange={(e) => setSiteUrl(e.target.value)}
        placeholder="yourshop.tomora.com.ng"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />

      <button
        type="button"
        onClick={run}
        disabled={running}
        className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {running ? step || "Testing…" : "Start the test"}
      </button>

      {results && (
        <div className="mt-8 space-y-4">
          {results.map((r) => (
            <div key={r.key} className="rounded-lg border p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{r.label}</span>
                <span className="text-lg font-semibold tabular-nums">
                  {r.median === null ? "did not finish" : `${r.median}ms`}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{r.hint}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Attempts:{" "}
                {r.runs
                  .map((x) => (x.ms === null ? x.note ?? "failed" : `${x.ms}ms`))
                  .join(" · ")}
              </p>
            </div>
          ))}

          <div className="rounded-lg border p-4 text-xs text-muted-foreground">
            <p>Connection reported by your phone: {connectionInfo()}</p>
            {edge && (
              <p className="mt-1">
                Tomora answered you from {String(edge.city ?? "unknown")},{" "}
                {String(edge.country ?? "unknown")}.
              </p>
            )}
            <p className="mt-1">These results were sent to us automatically. Thank you.</p>
          </div>

          <button
            type="button"
            onClick={copy}
            className="w-full rounded-md border px-4 py-2.5 text-sm font-medium"
          >
            {copied ? "Copied" : "Copy results"}
          </button>
        </div>
      )}
    </div>
  );
}
