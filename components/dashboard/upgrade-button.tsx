"use client";

import { useEffect, useState } from "react";
import { Loader2, CreditCard, Tag, X, Check } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNaira } from "@/lib/utils";
import { quotePlan, checkPlanCoupon, type CouponQuote } from "@/app/dashboard/(panel)/billing/actions";

/**
 * Starts a subscription or renewal.
 *
 * Clicking opens a summary rather than jumping straight to Paystack, because
 * that is where a coupon code has to be entered. The prices shown come from the
 * server every time it opens: the browser is never the one deciding what a plan
 * costs.
 */
export function UpgradeButton({
  label = "Upgrade",
  plan,
  planName,
  variant,
  className,
}: {
  label?: string;
  plan?: string;
  /** Shown as the dialog heading, e.g. "Starter". */
  planName?: string;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)} variant={variant} className={className}>
        <CreditCard className="h-4 w-4" />
        {label}
      </Button>
      {open && (
        <CheckoutDialog
          planId={plan || "pro"}
          planName={planName}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function CheckoutDialog({
  planId, planName, onClose,
}: {
  planId: string;
  planName?: string;
  onClose: () => void;
}) {
  const [quote, setQuote] = useState<CouponQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applied, setApplied] = useState<CouponQuote | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    quotePlan(planId).then((q) => {
      if (!live) return;
      setQuote(q);
      setLoading(false);
      if (!q.ok) setError(q.error || "Could not load the price.");
    });
    return () => { live = false; };
  }, [planId]);

  async function apply() {
    if (!code.trim()) return;
    setChecking(true);
    setCouponError(null);
    const res = await checkPlanCoupon(planId, code);
    setChecking(false);
    if (!res.ok) { setCouponError(res.error || "That code isn't valid."); setApplied(null); return; }
    setApplied(res);
  }

  function removeCoupon() {
    setApplied(null);
    setCode("");
    setCouponError(null);
  }

  async function pay() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, ...(applied?.code ? { coupon: applied.code } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment.");
      // A full-value coupon leaves nothing to pay, so there is no Paystack step.
      window.location.href = data.settled ? data.redirect : data.authorization_url;
    } catch (e: any) {
      setPaying(false);
      setError(e.message);
    }
  }

  const shown = applied?.ok ? applied : quote;
  const subtotal = quote?.wasAmount ?? 0;
  const discount = applied?.ok ? subtotal - (applied.nowAmount ?? subtotal) : 0;
  const total = shown?.totalWithVat ?? 0;
  const vat = total - (shown?.nowAmount ?? 0);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{planName ? `Subscribe to ${planName}` : "Confirm payment"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-ink/50">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* ---- coupon ---- */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink/70">
                <Tag className="h-3.5 w-3.5" /> Coupon code
              </label>
              {applied?.ok ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-emerald-800">
                    <Check className="h-4 w-4 shrink-0" />
                    <span className="truncate">{applied.code}</span>
                    <span className="shrink-0 font-normal">{applied.percent}% off</span>
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                    className="shrink-0 text-emerald-700/60 transition hover:text-emerald-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}
                    placeholder="Have a code?"
                    className="uppercase"
                  />
                  <Button type="button" variant="outline" onClick={apply} disabled={checking || !code.trim()}>
                    {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
              {couponError && <p className="mt-1.5 text-sm text-destructive">{couponError}</p>}
            </div>

            {/* ---- what it costs ---- */}
            <div className="space-y-2 rounded-lg border border-ink/10 bg-ink/[0.02] p-4 text-sm">
              <Row label={planName || "Plan"} value={formatNaira(subtotal)} />
              {discount > 0 && (
                <Row label={`Coupon (${applied?.percent}% off)`} value={`- ${formatNaira(discount)}`} good />
              )}
              <Row label="VAT (7.5%)" value={formatNaira(vat)} />
              <div className="flex items-center justify-between border-t border-ink/10 pt-2 text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatNaira(total)}</span>
              </div>
            </div>

            {total <= 0 && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                This code covers the full amount. There is nothing to pay.
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={pay} disabled={paying || !quote?.ok} className="w-full">
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {total <= 0 ? "Activate plan" : `Pay ${formatNaira(total)}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate text-ink/60">{label}</span>
      <span className={good ? "shrink-0 font-medium text-emerald-700" : "shrink-0 font-medium text-ink"}>{value}</span>
    </div>
  );
}
