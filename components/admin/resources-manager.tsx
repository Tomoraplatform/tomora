"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Pencil, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveResource, toggleResource, deleteResource } from "@/app/admin/resources/actions";
import { RESOURCE_CATEGORIES, priceFor } from "@/lib/resources/constants";
import { formatNaira } from "@/lib/utils";
import type { Resource } from "@/lib/resources/db";

const INPUT =
  "w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-ink/40";

type Draft = Omit<Resource, "id" | "views" | "copies" | "downloads" | "created_at" | "price"> & {
  id?: string;
};

const BLANK: Draft = {
  id: undefined,
  slug: "",
  title: "",
  description: "",
  category: "section",
  tags: "",
  prompt_text: "",
  html_code: "",
  preview_html: "",
  thumbnail_color: "#022245",
  is_paid: false,
  is_published: false,
  is_featured: false,
  sort_order: 0,
};

export function ResourcesManager({
  resources,
  sales,
}: {
  resources: Resource[];
  sales: Record<string, { count: number; revenue: number }>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  function save() {
    if (!draft) return;
    setError("");
    start(async () => {
      const res = await saveResource({ ...draft, sort_order: Number(draft.sort_order) || 0 });
      if (res.ok) setDraft(null);
      else setError(res.error || "Could not save.");
    });
  }

  function flip(id: string, field: "is_paid" | "is_published" | "is_featured", value: boolean) {
    start(async () => {
      const res = await toggleResource(id, field, value);
      if (!res.ok) setError(res.error || "Could not update.");
    });
  }

  function remove(r: Resource) {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteResource(r.id);
      if (!res.ok) setError(res.error || "Could not delete.");
    });
  }

  // ---- Editor ---------------------------------------------------------
  if (draft) {
    const price = priceFor(draft.category);
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-semibold text-ink">{draft.id ? "Edit resource" : "New resource"}</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              className={INPUT}
              placeholder="Cinematic car hero"
            />
          </Field>
          <Field label="Slug (leave blank to build from the title)">
            <input
              value={draft.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={INPUT}
              placeholder="cinematic-car-hero"
            />
          </Field>
          <Field label="Category">
            <select
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
              className={INPUT}
            >
              {RESOURCE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({formatNaira(c.price)} when paid)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preview background colour">
            <input
              type="color"
              value={draft.thumbnail_color}
              onChange={(e) => set("thumbnail_color", e.target.value)}
              className="h-11 w-full rounded-lg border border-ink/15"
            />
          </Field>
        </div>

        <Field label="Description" className="mt-4">
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className={INPUT}
            placeholder="A full screen video hero with word by word text animation."
          />
        </Field>

        <Field label="AI prompt (what the buyer copies)" className="mt-4">
          <textarea
            value={draft.prompt_text}
            onChange={(e) => set("prompt_text", e.target.value)}
            rows={6}
            className={`${INPUT} font-mono text-xs`}
          />
        </Field>

        <Field label="HTML (what the buyer copies and downloads)" className="mt-4">
          <textarea
            value={draft.html_code}
            onChange={(e) => set("html_code", e.target.value)}
            rows={8}
            className={`${INPUT} font-mono text-xs`}
          />
        </Field>

        <Field
          label="Preview HTML (leave blank to preview the HTML above)"
          className="mt-4"
        >
          <textarea
            value={draft.preview_html}
            onChange={(e) => set("preview_html", e.target.value)}
            rows={4}
            className={`${INPUT} font-mono text-xs`}
          />
        </Field>

        <div className="mt-4 flex flex-wrap items-center gap-5">
          <Check
            label={`Paid (${formatNaira(price)})`}
            checked={draft.is_paid}
            onChange={(v) => set("is_paid", v)}
          />
          <Check
            label="Published"
            checked={draft.is_published}
            onChange={(v) => set("is_published", v)}
          />
          <Check
            label="Featured"
            checked={draft.is_featured}
            onChange={(v) => set("is_featured", v)}
          />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            Order
            <input
              type="number"
              value={draft.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value) as Draft["sort_order"])}
              className="w-20 rounded-lg border border-ink/15 px-2 py-1"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <Button onClick={save} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </Button>
          <Button variant="outline" onClick={() => setDraft(null)} disabled={pending}>
            Cancel
          </Button>
        </div>

      </div>
    );
  }

  // ---- Table ----------------------------------------------------------
  return (
    <div>
      <div className="mb-4 flex justify-between">
        <p className="text-sm text-ink/50">
          Paid prices are fixed by category: sections and backgrounds{" "}
          {formatNaira(2000)}, landing pages {formatNaira(3500)}, websites {formatNaira(5000)}.
        </p>
        <Button onClick={() => setDraft({ ...BLANK })}>
          <Plus className="h-4 w-4" /> New resource
        </Button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {resources.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/15 bg-white px-5 py-14 text-center text-sm text-ink/50">
          No resources yet. Add the first one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/45">
              <tr>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Live</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => {
                const s = sales[r.id];
                return (
                  <tr key={r.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{r.title}</p>
                      <p className="text-xs text-ink/45">
                        {r.views} views · {r.copies} copies · {r.downloads} downloads
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {RESOURCE_CATEGORIES.find((c) => c.id === r.category)?.label || r.category}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => flip(r.id, "is_paid", !r.is_paid)}
                        disabled={pending}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          r.is_paid ? "bg-ink text-cream" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {r.is_paid ? formatNaira(r.price) : "Free"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => flip(r.id, "is_published", !r.is_published)}
                        disabled={pending}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          r.is_published
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-ink/10 text-ink/60"
                        }`}
                      >
                        {r.is_published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {s ? `${s.count} · ${formatNaira(s.revenue)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/resources/${r.slug}`}
                          target="_blank"
                          className="rounded-lg p-2 text-ink/50 hover:bg-ink/5 hover:text-ink"
                          title="View"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDraft({ ...r })}
                          className="rounded-lg p-2 text-ink/50 hover:bg-ink/5 hover:text-ink"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(r)}
                          disabled={pending}
                          className="rounded-lg p-2 text-ink/40 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ink/30"
      />
      {label}
    </label>
  );
}
