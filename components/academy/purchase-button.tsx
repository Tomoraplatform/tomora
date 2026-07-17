"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, PlayCircle } from "lucide-react";
import { purchaseCourse } from "@/app/academy/actions";
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
  const base = `inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 ${className}`;

  if (enrolled) {
    return (
      <button onClick={() => router.push(`/academy/learn/${slug}`)} className={`${base} bg-emerald-600 text-white`}>
        <PlayCircle className="h-4 w-4" /> Continue learning
      </button>
    );
  }

  async function buy() {
    if (!signedIn) { router.push(`/academy/join?course=${courseId}`); return; }
    setBusy(true); setError(null);
    const res = await purchaseCourse(courseId);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Something went wrong."); return; }
    if (res.url) { window.location.href = res.url; return; }
    if (res.enrolled) { router.push(`/academy/learn/${slug}`); router.refresh(); }
  }

  return (
    <div className="w-full">
      <button onClick={buy} disabled={busy} className={`${base} bg-ink text-cream disabled:opacity-60`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
        {price > 0 ? `Purchase, ${formatNaira(price)}` : "Enroll free"}
      </button>
      {error && <p className="mt-1.5 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
