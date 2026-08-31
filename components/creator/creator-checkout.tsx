"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, PlayCircle, Tag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { buyerSignUp, buyerSignIn, buyCreatorCourse, previewCreatorPrice } from "@/app/c/actions";

/**
 * Checkout for a creator course: create/sign in to the shared Tomora account,
 * apply a coupon, then pay price + 7.5% VAT via Paystack.
 */
export function CreatorCheckout({
  courseId, courseTitle, creatorSlug, courseSlug, bannerUrl,
  price, platformFee, vat, processingFee, total, signedIn, studentEmail, enrolled,
}: {
  courseId: string; courseTitle: string; creatorSlug: string; courseSlug: string;
  bannerUrl: string | null;
  price: number; platformFee: number; vat: number; processingFee: number; total: number;
  signedIn: boolean; studentEmail: string; enrolled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [form, setForm] = useState({ name: "", email: studentEmail, password: "" });
  const [coupon, setCoupon] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [applied, setApplied] = useState<{ price: number; platformFee: number; vat: number; processingFee: number; total: number; label?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = applied || { price, platformFee, vat, processingFee, total, label: undefined as string | undefined };

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setBusy(true); setError(null);
    const res = await previewCreatorPrice(courseId, coupon);
    setBusy(false);
    if (!res.ok) { setApplied(null); setError(res.error || "Invalid coupon."); return; }
    setApplied({ price: res.price!, platformFee: res.platformFee!, vat: res.vat!, processingFee: res.processingFee!, total: res.total!, label: res.discountLabel });
  }

  async function pay() {
    setBusy(true); setError(null);
    const res = await buyCreatorCourse(courseId, applied ? coupon : undefined);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Could not start payment."); return; }
    if (res.url) { window.location.href = res.url; return; }
    if (res.enrolled) router.push(`/c/${creatorSlug}/${courseSlug}/learn`);
  }

  async function authThenPay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = mode === "register"
      ? await buyerSignUp({ name: form.name, email: form.email, password: form.password })
      : await buyerSignIn({ email: form.email, password: form.password });
    if (!res.ok) { setBusy(false); setError(res.error || "Something went wrong."); return; }
    const buy = await buyCreatorCourse(courseId, applied ? coupon : undefined);
    setBusy(false);
    if (!buy.ok) { setError(buy.error || "Could not start payment."); router.refresh(); return; }
    if (buy.url) { window.location.href = buy.url; return; }
    if (buy.enrolled) router.push(`/c/${creatorSlug}/${courseSlug}/learn`);
  }

  if (enrolled) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6 text-center">
          <p className="text-sm text-ink/60">You already own this course.</p>
          <Button onClick={() => router.push(`/c/${creatorSlug}/${courseSlug}/learn`)} className="w-full">
            <PlayCircle className="h-4 w-4" /> Start learning
          </Button>
        </CardContent>
      </Card>
    );
  }

  const input = "w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm focus:border-ink/40 focus:outline-none";

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt={courseTitle} className="aspect-video w-full rounded-xl object-cover" />
        )}
        <div>
          <h1 className="text-lg font-bold text-ink">{courseTitle}</h1>
          <p className="mt-0.5 text-xs text-ink/50">Lifetime access in your Tomora portal.</p>
        </div>

        {/* price breakdown */}
        <div className="space-y-1.5 rounded-lg bg-ink/[0.03] p-4 text-sm">
          <div className="flex justify-between"><span className="text-ink/60">Course</span><span className="font-medium text-ink">{formatNaira(shown.price)}</span></div>
          <div className="flex justify-between"><span className="text-ink/60">Service fee</span><span className="font-medium text-ink">{formatNaira(shown.platformFee)}</span></div>
          <div className="flex justify-between"><span className="text-ink/60">VAT (7.5%)</span><span className="font-medium text-ink">{formatNaira(shown.vat)}</span></div>
          <div className="flex justify-between"><span className="text-ink/60">Processing fee</span><span className="font-medium text-ink">{formatNaira(shown.processingFee)}</span></div>
          <div className="flex justify-between border-t border-ink/10 pt-1.5 text-base"><span className="font-semibold text-ink">Total</span><span className="font-bold text-ink">{formatNaira(shown.total)}</span></div>
          {shown.label && <p className="pt-1 text-xs font-medium text-emerald-600">{shown.label} applied</p>}
        </div>

        {/* coupon */}
        {showCoupon ? (
          <div className="flex gap-2">
            <input className={input} value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setApplied(null); }} placeholder="Coupon code" />
            <Button variant="outline" onClick={applyCoupon} disabled={busy || !coupon.trim()}>Apply</Button>
          </div>
        ) : (
          <button onClick={() => setShowCoupon(true)} className="inline-flex items-center gap-1 text-xs font-medium text-ink/55 hover:text-ink">
            <Tag className="h-3.5 w-3.5" /> Have a coupon code?
          </button>
        )}

        {signedIn ? (
          <Button onClick={pay} disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Pay {formatNaira(shown.total)}
          </Button>
        ) : (
          <form onSubmit={authThenPay} className="space-y-3 border-t border-ink/10 pt-5">
            <p className="text-sm font-semibold text-ink">{mode === "register" ? "Create your account to continue" : "Sign in to continue"}</p>
            {mode === "register" && (
              <input className={input} placeholder="Your name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
            )}
            <input className={input} type="email" placeholder="Email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={input} type="password" placeholder={mode === "register" ? "Set a password (min 8 characters)" : "Password"} value={form.password} required minLength={mode === "register" ? 8 : 6} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Continue to payment
            </Button>
            <button type="button" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(null); }} className="w-full text-center text-xs text-ink/50 hover:text-ink">
              {mode === "register" ? "Already have a Tomora account? Sign in" : "New here? Create an account"}
            </button>
          </form>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-center text-[11px] text-ink/40">Secure payment by Paystack.</p>
      </CardContent>
    </Card>
  );
}
