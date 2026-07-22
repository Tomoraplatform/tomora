"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, PlayCircle, Tag, Check } from "lucide-react";
import { purchaseCourse, checkCoupon } from "@/app/academy/actions";
import { formatNaira } from "@/lib/utils";

export function PurchaseButton({
  courseId, slug, price, signedIn, enrolled, className = "",
}: {
  courseId: string;
  slug: string;
  price: number;
  signedIn: boolean;
  enrolled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCoupon, setShowCoupon] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<{ price: number; label: string } | null>(null);
  const base = `inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 ${className}`;

  if (enrolled) {
    return (
      <button onClick={() => router.push(`/academy/learn/${slug}`)} className={`${base} bg-emerald-600 text-white`}>
        <PlayCircle className="h-4 w-4" /> Continue learning
      </button>
    );
  }

  async function apply() {
    if (!coupon.trim()) return;
    setApplying(true); setError(null);
    const res = await checkCoupon(courseId, coupon);
    setApplying(false);
    if (!res.ok) { setApplied(null); setError(res.error || "Invalid coupon."); return; }
    setApplied({ price: res.discountedPrice ?? price, label: res.discountLabel || "Discount applied" });
  }

  async function buy() {
    if (!signedIn) { router.push(`/academy/join?course=${courseId}`); return; }
    setBusy(true); setError(null);
    const res = await purchaseCourse(courseId, applied ? coupon : undefined);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Something went wrong."); return; }
    if (res.url) { window.location.href = res.url; return; }
    if (res.enrolled) { router.push(`/academy/learn/${slug}`); router.refresh(); }
  }

  const payNow = applied ? applied.price : price;

  return (
    <div className="w-full space-y-2">
      {price > 0 && signedIn && (
        showCoupon ? (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setApplied(null); }}
                placeholder="Coupon code"
                className="min-w-0 flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm uppercase focus:border-ink/40 focus:outline-none"
              />
              <button onClick={apply} disabled={applying || !coupon.trim()} className="rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50">
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </button>
            </div>
            {applied && (
              <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" /> {applied.label} · now {formatNaira(applied.price)}
              </p>
            )}
          </div>
        ) : (
          <button onClick={() => setShowCoupon(true)} className="inline-flex items-center gap-1 text-xs font-medium text-ink/55 hover:text-ink">
            <Tag className="h-3.5 w-3.5" /> Have a coupon code?
          </button>
        )
      )}

      <button onClick={buy} disabled={busy} className={`${base} bg-ink text-cream disabled:opacity-60`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
        {price > 0
          ? applied
            ? `Pay ${formatNaira(payNow)}`
            : `Purchase, ${formatNaira(price)}`
          : "Enroll free"}
      </button>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
