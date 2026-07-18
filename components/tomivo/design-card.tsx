"use client";

import { Lock, Eye } from "lucide-react";
import { DesignPreview } from "@/components/tomivo/design-preview";
import type { TomivoDesignCard } from "@/lib/tomivo/db";

const CATEGORY_LABEL: Record<string, string> = {
  "landing-page": "Landing page",
  "animated-background": "Animated background",
  gradient: "Gradient",
};

export function DesignCard({ design, onOpen }: { design: TomivoDesignCard; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] text-left transition hover:border-white/25 hover:shadow-xl hover:shadow-black/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: design.thumbnail_color }}>
        {/* Live, non-interactive miniature of the design. */}
        <div className="pointer-events-none absolute inset-0">
          <DesignPreview html={design.preview_html} scale={0.5} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <div className="absolute right-3 top-3 flex gap-2">
          {design.is_premium ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-[#101319]">
              <Lock className="h-3 w-3" /> Pro
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-[#04231a]">Free</span>
          )}
        </div>
        <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 translate-y-2 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#101319] opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <Eye className="h-3.5 w-3.5" /> Preview & copy
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold text-white">{design.title}</h3>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-white/50">{design.description}</p>
        <span className="mt-3 text-[11px] font-medium uppercase tracking-wide text-white/35">
          {CATEGORY_LABEL[design.category] || design.category}
        </span>
      </div>
    </button>
  );
}
