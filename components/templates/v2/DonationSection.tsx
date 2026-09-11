"use client";

import { useState } from "react";
import { Heart, Loader2, CheckCircle2, Target } from "lucide-react";
import type { SiteData, CatalogDonationProject } from "@/lib/database.types";
import { formatNaira, contrastText } from "@/lib/utils";
import { useStore } from "../store-context";
import { useDonation } from "../donation-context";
import { heading, subheading } from "./shared";
import { optimisedFallback, optimisedSrcSet } from "@/lib/image";
import { PAYSTACK_FEE_PERCENT } from "@/lib/constants";
import { quoteCharge } from "@/lib/platform-fee";
import { useSiteFees, type SiteFees } from "@/components/published/use-site-fees";

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

/** Starts a donation and opens the Paystack popup. Resolves when payment completes. */
async function startDonation(
  { siteId, name, email, amount, projectId }: { siteId: string; name: string; email: string; amount: number; projectId?: string },
  { onSuccess, onCancel, onError }: { onSuccess: () => void; onCancel: () => void; onError: (msg: string) => void }
) {
  const res = await fetch("/api/donations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteId, name, email, amount, projectId }),
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
      }).finally(onSuccess);
    },
    onCancel,
    onError: (err: { message?: string }) => onError(err?.message || "Payment failed."),
  });
}

export function DonationSection({ siteData, brandColor }: { siteData: SiteData; brandColor: string }) {
  const { siteId } = useStore();
  // Read once here rather than per project card.
  const fees = useSiteFees(siteData.donationEnabled ? siteId : null);
  if (!siteData.donationEnabled) return null;
  const projects = (siteData.donationProjects || []).filter((p) => p.name?.trim());
  if (projects.length > 0) {
    return <ProjectsDonation siteData={siteData} brandColor={brandColor} projects={projects} fees={fees} />;
  }
  return <GeneralDonation siteData={siteData} brandColor={brandColor} fees={fees} />;
}

/**
 * What the donor will actually be charged, when that is more than the gift:
 * Tomora's fee on the organisation's plan, plus Paystack's fee when the
 * organisation passes it on. The gift itself, and the progress bar, stay the
 * amount the donor chose.
 */
function DonationBreakdown({ amount, fees, feeBearer }: { amount: number; fees: SiteFees | null; feeBearer?: string }) {
  if (amount < 100) return null;
  const q = quoteCharge(amount, fees?.rate, feeBearer === "customer" ? PAYSTACK_FEE_PERCENT : 0);
  const fee = q.totalCharged - amount;
  if (fee <= 0) return null;
  return (
    <div className="mt-3 space-y-1 rounded-lg bg-black/[0.03] px-3 py-2 text-xs text-ink/60">
      <div className="flex justify-between"><span>Donation</span><span>{formatNaira(amount)}</span></div>
      <div className="flex justify-between"><span>Processing fee</span><span>{formatNaira(fee)}</span></div>
      <div className="flex justify-between font-semibold text-ink"><span>Total</span><span>{formatNaira(q.totalCharged)}</span></div>
    </div>
  );
}

/* ------------------- Multi-project layout ------------------- */

function ProjectsDonation({
  siteData, brandColor, projects, fees,
}: {
  siteData: SiteData; brandColor: string; projects: CatalogDonationProject[]; fees: SiteFees | null;
}) {
  const { canDonate, unassigned } = useDonation();

  return (
    <section id="donate" className="mx-auto max-w-6xl px-5 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-ink">{heading(siteData, "donation", "Support Our Cause")}</h2>
        <p className="mt-3 text-ink/60">{subheading(siteData, "donation", "Choose a project below, every contribution counts.")}</p>
      </div>

      <div className={`mt-10 grid gap-6 md:grid-cols-2 ${projects.length >= 3 ? "xl:grid-cols-3" : ""}`}>
        {projects.map((p) => <ProjectCard key={p.id} project={p} brandColor={brandColor} feeBearer={siteData.feeBearer} fees={fees} />)}
      </div>

      {unassigned.count > 0 && (
        // Given before these projects existed, or to one since removed. The
        // money is real and already in the wallet, so it is shown rather than
        // dropped, just not credited to a project that did not receive it.
        <p className="mt-6 text-center text-sm text-ink/60">
          Plus {formatNaira(unassigned.raised)} from {unassigned.count}{" "}
          {unassigned.count === 1 ? "gift" : "gifts"} to our general fund.
        </p>
      )}

      {!canDonate && (
        <p className="mt-6 text-center text-xs text-ink/50">Online giving activates once the organisation adds their payout bank.</p>
      )}
    </section>
  );
}

function ProjectCard({
  project, brandColor, feeBearer, fees,
}: {
  project: CatalogDonationProject; brandColor: string; feeBearer?: "customer" | "owner"; fees: SiteFees | null;
}) {
  const { siteId } = useStore();
  const { projects: totals, refresh } = useDonation();
  const onBrand = contrastText(brandColor);

  const [amount, setAmount] = useState<number>(5000);
  const [donor, setDonor] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cards lead with a clean CTA; the giving form expands on demand.
  const [formOpen, setFormOpen] = useState(false);

  // Online gifts come from the server; the offline amount comes from the live
  // project data (props), so editing it in the editor moves the bar at once.
  const t = totals[project.id];
  const online = t ? Math.max(0, t.raised - Math.max(0, Math.round(t.manual || 0))) : 0;
  const raised = online + Math.max(0, Math.round(project.manualRaised || 0));
  // Gifts are counted the same way the money is: the server's online tally,
  // plus the offline gifts the owner recorded, taken from the live props so
  // editing the number moves the line straight away. Counting only online
  // gifts is what made this sit still while the amount above it climbed.
  const onlineCount = t ? Math.max(0, t.count - Math.max(0, Math.round(t.manualCount || 0))) : 0;
  const count = onlineCount + Math.max(0, Math.round(project.manualCount || 0));
  const goal = Math.max(0, Math.round(project.goal || 0));
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  async function donate() {
    setError(null);
    if (!siteId) { setError("Donations work on the published site."); return; }
    if (!donor.email || amount < 100) { setError("Enter your email and an amount of at least ₦100."); return; }
    setBusy(true);
    try {
      await startDonation(
        { siteId, name: donor.name, email: donor.email, amount, projectId: project.id },
        {
          onSuccess: () => { setBusy(false); setDone(true); refresh(); },
          onCancel: () => setBusy(false),
          onError: (msg) => { setBusy(false); setError(msg); },
        }
      );
    } catch (e: any) {
      setBusy(false);
      setError(e.message || "Could not start this donation.");
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      {project.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={optimisedFallback(project.image)}
          {...(optimisedSrcSet(project.image) ? { srcSet: optimisedSrcSet(project.image), sizes: "(max-width: 640px) 100vw, 380px" } : {})}
          alt={project.name} loading="lazy" decoding="async" className="h-44 w-full object-cover" />
      )}
      <div className="p-6 pb-0">
        <h3 className="text-lg font-bold text-ink">{project.name}</h3>
        {project.description && <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{project.description}</p>}

        <div className="mt-4">
          <div className="flex flex-wrap items-end justify-between gap-x-3 text-sm">
            <span className="text-lg font-bold text-ink">{formatNaira(raised)}</span>
            {goal > 0 && <span className="text-ink/50">of {formatNaira(goal)}</span>}
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: brandColor }} />
          </div>
          <p className="mt-1.5 text-xs text-ink/50">
            {count} {count === 1 ? "gift" : "gifts"}{goal > 0 ? ` · ${pct}% of target` : ""}
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1 border-t border-black/5 p-6 pt-5">
        {done ? (
          <div className="flex h-full flex-col items-center justify-center py-4 text-center">
            <CheckCircle2 className="h-10 w-10" style={{ color: brandColor }} />
            <p className="mt-2 font-semibold text-ink">Thank you for your gift!</p>
            <button onClick={() => { setDone(false); setFormOpen(false); }} className="mt-2 text-sm font-semibold" style={{ color: brandColor }}>Give again</button>
          </div>
        ) : !formOpen ? (
          <button
            onClick={() => setFormOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
            style={{ background: brandColor, color: onBrand }}
          >
            <Heart className="h-4 w-4" /> Donate Now
          </button>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setAmount(p)}
                  className="rounded-lg border px-1 py-2 text-sm font-semibold transition"
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
            <DonationBreakdown amount={amount} fees={fees} feeBearer={feeBearer} />
            <button onClick={() => setFormOpen(false)} className="mt-2 w-full text-center text-xs font-medium text-ink/50 hover:text-ink">Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------- Single general-goal layout ------------------- */

function GeneralDonation({ siteData, brandColor, fees }: { siteData: SiteData; brandColor: string; fees: SiteFees | null }) {
  const { siteId } = useStore();
  const { raised, goal, count, canDonate, refresh } = useDonation();
  const onBrand = contrastText(brandColor);
  const [amount, setAmount] = useState<number>(5000);
  const [donor, setDonor] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  async function donate() {
    setError(null);
    if (!siteId) { setError("Donations work on the published site."); return; }
    if (!donor.email || amount < 100) { setError("Enter your email and an amount of at least ₦100."); return; }
    setBusy(true);
    try {
      await startDonation(
        { siteId, name: donor.name, email: donor.email, amount },
        {
          onSuccess: () => { setBusy(false); setDone(true); refresh(); },
          onCancel: () => setBusy(false),
          onError: (msg) => { setBusy(false); setError(msg); },
        }
      );
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
              <DonationBreakdown amount={amount} fees={fees} feeBearer={siteData.feeBearer} />
              {!canDonate && <p className="mt-2 text-center text-xs text-ink/50">Online giving activates once the organisation adds their payout bank.</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
