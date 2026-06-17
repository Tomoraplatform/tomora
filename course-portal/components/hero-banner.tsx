"use client";

import { useState } from "react";
import { COURSE_BANNER_IMAGE } from "@/lib/constants";
import { Sparkles } from "lucide-react";

/**
 * Hero banner image with a graceful fallback. If the file at
 * /public/images/course-banner.png is missing, a branded placeholder shows
 * instead of a broken-image icon. Drop the real file in and it renders.
 */
export function HeroBanner() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-[3/2] w-full items-center justify-center rounded-2xl border border-line bg-gradient-to-br from-accent-soft to-surface-warm text-center">
        <div className="px-6">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-accent-dark shadow-card">
            <Sparkles size={22} />
          </span>
          <p className="mt-3 font-semibold text-charcoal">
            Make Extra Income with Claude AI
          </p>
          <p className="mt-1 text-xs text-muted">
            Add public/images/course-banner.png to show your banner here.
          </p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={COURSE_BANNER_IMAGE}
      alt="Make Extra Income with Claude AI"
      onError={() => setFailed(true)}
      className="block w-full rounded-2xl border border-line object-cover shadow-card"
    />
  );
}
