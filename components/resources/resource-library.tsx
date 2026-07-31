"use client";

import { useMemo, useState } from "react";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { ResourceCard } from "@/components/resources/resource-card";
import { RESOURCE_CATEGORIES } from "@/lib/resources/constants";
import { formatNaira } from "@/lib/utils";
import type { ResourceCard as Card } from "@/lib/resources/db";

export function ResourceLibrary({
  resources,
  owned,
  email,
  unlockNotice,
}: {
  resources: Card[];
  owned: string[];
  email: string | null;
  unlockNotice: string | null;
}) {
  const [category, setCategory] = useState<string>(RESOURCE_CATEGORIES[0].id);
  const ownedSet = useMemo(() => new Set(owned), [owned]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const c of RESOURCE_CATEGORIES) map.set(c.id, []);
    for (const r of resources) map.get(r.category)?.push(r);
    return map;
  }, [resources]);

  const active = RESOURCE_CATEGORIES.find((c) => c.id === category) || RESOURCE_CATEGORIES[0];
  const shown = byCategory.get(category) || [];

  return (
    <div className="min-h-screen bg-cream">
      <MarketingNav />

      <section className="border-b border-ink/10 bg-white">
        <div className="container py-14 text-center md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink/70">
            <Sparkles className="h-3.5 w-3.5" /> Tomora Resources
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight text-ink md:text-5xl">
            Build faster with pieces that already work
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink/60">
            Copy the AI prompt, copy the HTML, or download the file. Some are free, the rest are a
            one off payment. No account needed.
          </p>
        </div>
      </section>

      {unlockNotice === "ok" && (
        <div className="container pt-6">
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <Check className="h-4 w-4 shrink-0" />
            Welcome back{email ? `, ${email}` : ""}. Everything you have bought is unlocked on this
            device.
          </p>
        </div>
      )}
      {unlockNotice === "invalid" && (
        <div className="container pt-6">
          <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            That unlock link is not valid any more. Use the most recent link from your receipt
            email.
          </p>
        </div>
      )}

      <section className="container py-10 md:py-14">
        <div className="mb-8 flex flex-wrap gap-2">
          {RESOURCE_CATEGORIES.map((c) => {
            const count = byCategory.get(c.id)?.length || 0;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  category === c.id
                    ? "bg-ink text-cream"
                    : "bg-white text-ink/60 hover:text-ink border border-ink/10"
                }`}
              >
                {c.label}
                {count > 0 && (
                  <span className={category === c.id ? "ml-2 text-cream/60" : "ml-2 text-ink/35"}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-ink">{active.title}</h2>
          <p className="mt-1 text-ink/60">{active.blurb}</p>
          <p className="mt-1 text-sm text-ink/45">
            Paid {active.label.toLowerCase()} are {formatNaira(active.price)} each, one payment for
            lifetime access.
          </p>
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-20 text-center">
            <p className="text-lg font-semibold text-ink">Coming soon</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/55">
              We are building out the {active.label.toLowerCase()} library now. Check back shortly,
              or start with the sections that are already live.
            </p>
            {category !== "section" && (
              <button
                onClick={() => setCategory("section")}
                className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream"
              >
                Browse sections
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((r) => (
              <ResourceCard key={r.id} resource={r} owned={ownedSet.has(r.id)} />
            ))}
          </div>
        )}
      </section>

      <MarketingFooter />
    </div>
  );
}
