"use client";

import Link from "next/link";
import { Lock, Check, Download, Copy } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { DesignPreview } from "@/components/tomivo/design-preview";
import type { ResourceCard as Card } from "@/lib/resources/db";

/**
 * One resource tile. The preview is a live, non-interactive render of the
 * resource itself, so what the visitor sees is exactly what they get.
 */
export function ResourceCard({ resource, owned }: { resource: Card; owned: boolean }) {
  const locked = resource.is_paid && !owned;

  return (
    <Link
      href={`/resources/${resource.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ backgroundColor: resource.thumbnail_color }}
      >
        {resource.preview_html ? (
          <DesignPreview html={resource.preview_html} scale={0.32} className="h-full w-full" />
        ) : null}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
          {resource.is_paid ? formatNaira(resource.price) : "Free"}
        </span>

        {owned && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            <Check className="h-3 w-3" /> Yours
          </span>
        )}
        {locked && (
          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-ink/80 text-white shadow-sm">
            <Lock className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-ink">{resource.title}</h3>
        {resource.description && (
          <p className="mt-1 line-clamp-2 text-sm text-ink/60">{resource.description}</p>
        )}
        <div className="mt-3 flex items-center gap-4 pt-1 text-xs text-ink/45">
          <span className="flex items-center gap-1">
            <Copy className="h-3.5 w-3.5" /> {resource.copies} copied
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" /> {resource.downloads}
          </span>
        </div>
      </div>
    </Link>
  );
}
