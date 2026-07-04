"use client";

import { useState } from "react";
import { Heart, Loader2, CheckCircle2, Target } from "lucide-react";
import type { SiteData } from "@/lib/database.types";
import { formatNaira, contrastText } from "@/lib/utils";
import { useStore } from "../store-context";
import { useDonation } from "../donation-context";
import { heading, subheading } from "./shared";

declare global {
  interface Window { PaystackPop?: any; }
}

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack."));
    document.body.appendChild(s);
  });
}

const PRESETS = [1000, 5000, 10000, 25000];

export function DonationSection({ siteData, brandColor }: { siteData: SiteData; brandColor: string }) {
  const { siteId } = useStore();
  const { raised, goal, count, canDonate, refresh } = useDonation();
  const onBrand = contrastText(brandColor);
  const [amount, setAmount] = useState<number>(5000);
  const [donor, setDonor] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!siteData.donationEnabled) return null;

  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  async function donate() {
    setError(null);
    if (!siteId) { setError("Donations work on the published site."); return; }
    if (!donor.email || amount < 100) { setError("Enter your email and an amount of at least ₦100."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, name: donor.name, email: donor.email, amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.accessCode) throw new Error(data.error || "Could not start this donation.");
      await loadPaystack();
      const popup = new window.PaystackPop();
      popup.resumeTransaction(data.accessCode, {
        onSuccess: (txn: { reference: string }) => {
          fetch("/api/donations/confirm", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: txn.reference || data.reference }),
          }).finally(() => { setBusy(false); setDone(true); refresh(); });
        },
        onCancel: () => setBusy(false),
        onError: (err: { message?: string }) => { setBusy(false); setError(err?.message || "Payment failed."); },
      });
    } catch (e: any) {
      setBusy(false);
      setError(e.message || "Could not start this donation.");
    }
  }

  return (
    <section id="donate" className="mx-auto max-w-5xl px-5 py-16">
      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm md:grid md:grid-cols-2">
        <div className="p-8 text-white sm:p-10" style={{ background: brandColor }}>
          <Heart className="h-9 w-9" style={{ color: onBrand, opacity: 0.9 }} />
          <h2 className="mt-4 text-3xl font-bold">{heading(siteData, "donation", "Support Our Cause")}</h2>
          <p className="mt-3 opacity-90">{subheading(siteData, "donation", "Your gift helps us reach more people. Every contribution counts.")}</p>

          {goal > 0 && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-xl bg-white/15 px-4 py-3">
              <Target className="h-6 w-6" style={{ color: onBrand }} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Our target</p>
                <p className="text-xl font-bold">{formatNaira(goal)}</p>
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-end justify-between text-sm">
              <span className="text-2xl font-bold">{formatNaira(raised)}</span>
              {goal > 0 && <span className="opacity-80">raised of {formatNaira(goal)}</span>}
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm opacity-80">{count} {count === 1 ? "donation" : "donations"} so far{goal > 0 ? ` · ${pct}% of goal` : ""}</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          {done ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-12 w-12" style={{ color: brandColor }} />
              <p className="mt-3 text-lg font-semibold text-ink">Thank you for your gift!</p>
              <p className="mt-1 text-sm text-ink/60">Your donation has been received.</p>
              <button onClick={() => setDone(false)} className="mt-4 text-sm font-semibold" style={{ color: brandColor }}>Give again</button>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink">Choose an amount</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {PRESETS.map((p) => (
                  <button key={p} onClick={() => setAmount(p)}
                    className="rounded-lg border px-2 py-2 text-sm font-semibold transition"
                    style={amount === p ? { background: brandColor, color: onBrand, borderColor: brandColor } : { borderColor: "rgba(0,0,0,0.15)", color: "#022245" }}>
                    {p >= 1000 ? `${p / 1000}k` : p}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <input type="number" min={100} value={amount} onChange={(e) => setAmount(Math.round(Number(e.target.value) || 0))}
                  placeholder="Other amount (₦)" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink/40" />
                <input value={donor.name} onChange={(e) => setDonor((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Your name (optional)" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink/40" />
                <input type="email" value={donor.email} onChange={(e) => setDonor((d) => ({ ...d, email: e.target.value }))}
                  placeholder="Email" className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-ink/40" />
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <button onClick={donate} disabled={busy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60"
                style={{ background: brandColor, color: onBrand }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />} Donate {amount >= 100 ? formatNaira(amount) : ""}
              </button>
              {siteData.feeBearer === "customer" && <p className="mt-2 text-center text-xs text-ink/50">A small payment-processing fee is added at checkout.</p>}
              {!canDonate && <p className="mt-2 text-center text-xs text-ink/50">Online giving activates once the organisation adds their payout bank.</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
