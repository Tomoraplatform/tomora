"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import type { ResourceCard } from "@/lib/resources/db";

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { PaystackPop?: unknown }).PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window."));
    document.body.appendChild(s);
  });
}

/**
 * Guest checkout for a single paid resource. No account is created: the name
 * and email are only used for the receipt and for the link that restores the
 * purchase on another device.
 */
export function UnlockPanel({ resource }: { resource: ResourceCard }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function buy(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/resources/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: resource.slug, name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start the payment.");

      // Bought it before with this email: unlock without charging again.
      if (data.alreadyOwned) {
        await fetch("/api/resources/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: data.reference || "" }),
        }).catch(() => {});
        router.refresh();
        return;
      }

      await loadPaystack();
      const Pop = (window as unknown as { PaystackPop: new () => {
        resumeTransaction: (code: string, opts: Record<string, unknown>) => void;
      } }).PaystackPop;
      const popup = new Pop();
      popup.resumeTransaction(data.accessCode, {
        onSuccess: (txn: { reference?: string }) => {
          fetch("/api/resources/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: txn?.reference || data.reference }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.ok) router.refresh();
              else setError("Payment received. Refresh in a moment to unlock.");
            })
            .catch(() => setError("Payment received. Refresh in a moment to unlock."))
            .finally(() => setBusy(false));
        },
        onCancel: () => setBusy(false),
        onError: () => {
          setError("Payment failed. Please try again.");
          setBusy(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={buy} className="mt-6 rounded-2xl border border-ink/10 bg-white p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Lock className="h-4 w-4" /> Unlock this resource
      </p>
      <p className="mt-1 text-sm text-ink/55">
        One payment of {formatNaira(resource.price)}. No account, no subscription.
      </p>

      <div className="mt-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-ink/40"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Your email"
          required
          className="w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-ink/40"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 font-semibold text-cream transition hover:bg-ink/90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Opening checkout" : `Pay ${formatNaira(resource.price)}`}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-4 flex items-start gap-2 text-xs text-ink/45">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        We email your receipt with a link that restores this purchase on any device. Card, transfer
        or USSD through Paystack.
      </p>
    </form>
  );
}
