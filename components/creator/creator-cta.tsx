import Link from "next/link";
import { Store, ArrowRight, LayoutDashboard } from "lucide-react";

/**
 * Portal entry point: invites students to become creators, or takes existing
 * creators straight to their course portal.
 */
export function CreatorCta({ creatorSlug }: { creatorSlug: string | null }) {
  if (creatorSlug) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink">
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">My course portal</p>
              <p className="text-xs text-ink/55">Manage your courses, pricing, sales page and earnings.</p>
            </div>
          </div>
          <Link href="/academy/sell" className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-cream hover:opacity-90">
            Open portal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-ink p-5 text-cream">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream/15 text-cream">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Teach on Tomora</p>
            <p className="text-xs text-cream/70">Publish your own course, get your own sales page, and keep the full price of every sale.</p>
          </div>
        </div>
        <Link href="/academy/sell" className="inline-flex items-center gap-2 rounded-lg bg-cream px-4 py-2.5 text-sm font-semibold text-ink hover:opacity-90">
          I want to sell my course <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
