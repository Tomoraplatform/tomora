"use client";

import { useMemo, useState } from "react";
import { DesignCard } from "@/components/tomivo/design-card";
import { PreviewDialog } from "@/components/tomivo/preview-dialog";
import { TOMIVO_CATEGORIES } from "@/lib/tomivo/constants";
import type { TomivoDesignCard } from "@/lib/tomivo/db";

export function DesignGallery({ designs }: { designs: TomivoDesignCard[] }) {
  const [category, setCategory] = useState<string>("all");
  const [open, setOpen] = useState<TomivoDesignCard | null>(null);

  const shown = useMemo(
    () => (category === "all" ? designs : designs.filter((d) => d.category === category)),
    [designs, category],
  );

  const scrollToPricing = () => {
    setOpen(null);
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {TOMIVO_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              category === c.id ? "bg-white text-[#101319]" : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-white/40">No designs in this category yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((d) => (
            <DesignCard key={d.id} design={d} onOpen={() => setOpen(d)} />
          ))}
        </div>
      )}

      {open && <PreviewDialog design={open} onClose={() => setOpen(null)} onLockedSubscribe={scrollToPricing} />}
    </div>
  );
}
