"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Save, Check,
  Type as TypeIcon, ImageIcon, Palette, X, ExternalLink, MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SalesPageView } from "@/components/creator/sales-page-view";
import { updateCreatorCourse } from "@/app/academy/sell/actions";
import { uploadCreatorImage } from "@/lib/creator/client-upload";
import { SECTION_LIBRARY, newSection, type SalesPage, type SalesSection, type SectionType } from "@/lib/creator/sales-page";
import type { AcademyCreator, CreatorCourseWithContent } from "@/lib/creator/db";

/**
 * Sales page builder: live preview on the left, section inspector on the
 * right. Creators edit every text and image, hide or delete any section,
 * reorder, and add new sections from the library.
 */
export function SalesPageEditor({ initialPage, creator, course, courses }: {
  initialPage: SalesPage;
  creator: AcademyCreator;
  course: CreatorCourseWithContent;
  /** Other active courses, for button links. */
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [page, setPage] = useState<SalesPage>(initialPage);
  const [selected, setSelected] = useState<string | null>(initialPage.sections[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const patchPage = (next: Partial<SalesPage>) => { setPage((p) => ({ ...p, ...next })); setSaved(false); };
  const patchSection = (id: string, patch: Partial<SalesSection>) => {
    setPage((p) => ({ ...p, sections: p.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
    setSaved(false);
  };

  function move(id: string, dir: -1 | 1) {
    setPage((p) => {
      const i = p.sections.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.sections.length) return p;
      const next = [...p.sections];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, sections: next };
    });
    setSaved(false);
  }

  function remove(id: string) {
    setPage((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== id) }));
    if (selected === id) setSelected(null);
    setSaved(false);
  }

  function add(type: SectionType) {
    const s = newSection(type);
    setPage((p) => ({ ...p, sections: [...p.sections, s] }));
    setSelected(s.id);
    setAdding(false);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const res = await updateCreatorCourse(course.id, { sales_page: page as unknown as Record<string, unknown> });
    setSaving(false);
    if (!res.ok) { window.alert(res.error || "Could not save."); return; }
    setSaved(true);
    router.refresh();
  }

  const current = page.sections.find((s) => s.id === selected) || null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* preview */}
      <div className="min-w-0 flex-1 bg-white">
        <div className="pointer-events-none">
          <SalesPageView page={page} creator={creator} course={course} ctaHref={() => "#"} />
        </div>
      </div>

      {/* inspector */}
      <aside className="w-full shrink-0 border-t border-ink/10 bg-cream lg:h-screen lg:w-96 lg:overflow-y-auto lg:border-l lg:border-t-0">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-ink/10 bg-cream px-4 py-3">
          <p className="text-sm font-bold text-ink">Sales page</p>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>

        <div className="space-y-5 p-4">
          {/* brand colours */}
          <div className="space-y-2 rounded-lg border border-ink/10 bg-white p-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink/55">
              <Palette className="h-3.5 w-3.5" /> Colours
            </p>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-xs text-ink/60">
                Main
                <input type="color" value={page.color || creator.brand_color} onChange={(e) => patchPage({ color: e.target.value })} className="h-8 w-10 cursor-pointer rounded border border-ink/15" />
              </label>
              <label className="flex items-center gap-2 text-xs text-ink/60">
                Accent
                <input type="color" value={page.color2 || creator.brand_color_2} onChange={(e) => patchPage({ color2: e.target.value })} className="h-8 w-10 cursor-pointer rounded border border-ink/15" />
              </label>
            </div>
          </div>

          {/* sections list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Sections</p>
            {page.sections.map((s, i) => (
              <div key={s.id} className={`rounded-lg border bg-white ${selected === s.id ? "border-ink/40" : "border-ink/10"}`}>
                <div className="flex items-center gap-1.5 p-2">
                  <button onClick={() => setSelected(selected === s.id ? null : s.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium text-ink">{s.heading || labelFor(s.type)}</span>
                    <span className="text-[11px] text-ink/45">{labelFor(s.type)}</span>
                  </button>
                  <button onClick={() => move(s.id, -1)} disabled={i === 0} className="text-ink/35 hover:text-ink disabled:opacity-25" title="Move up"><ChevronUp className="h-4 w-4" /></button>
                  <button onClick={() => move(s.id, 1)} disabled={i === page.sections.length - 1} className="text-ink/35 hover:text-ink disabled:opacity-25" title="Move down"><ChevronDown className="h-4 w-4" /></button>
                  <button onClick={() => patchSection(s.id, { hidden: !s.hidden })} className={s.hidden ? "text-ink/30" : "text-emerald-600"} title={s.hidden ? "Hidden" : "Visible"}>
                    {s.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { if (window.confirm("Remove this section?")) remove(s.id); }} className="text-ink/35 hover:text-destructive" title="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>

                {selected === s.id && (
                  <div className="space-y-3 border-t border-ink/10 p-3">
                    <SectionFields section={s} courses={courses} courseId={course.id} onChange={(patch) => patchSection(s.id, patch)} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* add section */}
          {adding ? (
            <div className="space-y-2 rounded-lg border border-ink/15 bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Add a section</p>
                <button onClick={() => setAdding(false)} className="text-ink/40 hover:text-ink"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-1.5">
                {SECTION_LIBRARY.map((item) => (
                  <button key={item.type} onClick={() => add(item.type)} className="w-full rounded-md border border-ink/10 px-3 py-2 text-left hover:bg-ink/[0.03]">
                    <span className="block text-sm font-medium text-ink">{item.label}</span>
                    <span className="block text-[11px] text-ink/50">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add section
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

function labelFor(type: SectionType): string {
  const found = SECTION_LIBRARY.find((s) => s.type === type);
  if (found) return found.label;
  return type === "hero" ? "Hero" : type === "references" ? "References" : type === "feature" ? "Feature" : type;
}

/** Field set for the selected section, driven by its type. */
function SectionFields({ section: s, courses, courseId, onChange }: {
  section: SalesSection;
  courses: { id: string; title: string }[];
  courseId: string;
  onChange: (patch: Partial<SalesSection>) => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);

  async function pickImage(target: "image" | `item-${number}` | "gallery") {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(target);
      const { url, error } = await uploadCreatorImage(file, "section");
      setUploading(null);
      if (error) { window.alert(error); return; }
      if (!url) return;
      if (target === "image") onChange({ image: url });
      else if (target === "gallery") onChange({ images: [...(s.images || []), url] });
      else {
        const i = Number(target.split("-")[1]);
        const items = [...(s.items || [])];
        items[i] = { ...items[i], image: url };
        onChange({ items });
      }
    };
    input.click();
  }

  const hasHeading = !["image", "button", "imageButton"].includes(s.type);
  const hasBody = ["hero", "imageText", "videoText", "overlay", "feature"].includes(s.type);
  const hasImage = ["image", "imageText", "overlay", "imageButton", "feature"].includes(s.type);
  const hasVideo = ["video", "videoText"].includes(s.type);
  const hasGallery = s.type === "references";
  const hasList = ["outcomes", "testimonials", "cards", "feature"].includes(s.type);
  const hasCta = ["hero", "outcomes", "references", "overlay", "imageButton", "button", "imageText", "videoText", "feature"].includes(s.type);

  return (
    <>
      {hasHeading && (
        <div className="space-y-1.5">
          <Label className="text-xs">Heading</Label>
          <Input className="h-9" value={s.heading || ""} onChange={(e) => onChange({ heading: e.target.value })} />
        </div>
      )}
      {(s.type === "hero" || s.type === "contains" || s.type === "references") && (
        <div className="space-y-1.5">
          <Label className="text-xs">Subheading</Label>
          <Input className="h-9" value={s.subheading || ""} onChange={(e) => onChange({ subheading: e.target.value })} />
        </div>
      )}
      {hasBody && (
        <div className="space-y-1.5">
          <Label className="text-xs">Text</Label>
          <Textarea rows={3} value={s.body || ""} onChange={(e) => onChange({ body: e.target.value })} />
        </div>
      )}

      {hasImage && (
        <div className="space-y-1.5">
          <Label className="text-xs">Image</Label>
          <div className="flex items-center gap-2">
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="h-12 w-20 rounded object-cover" />
            )}
            <Button type="button" size="sm" variant="outline" onClick={() => pickImage("image")} disabled={uploading === "image"}>
              {uploading === "image" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
              {s.image ? "Replace" : "Upload"}
            </Button>
            {s.image && <button onClick={() => onChange({ image: "" })} className="text-xs text-ink/45 underline">Remove</button>}
          </div>
        </div>
      )}

      {hasVideo && (
        <div className="space-y-1.5">
          <Label className="text-xs">Video link</Label>
          <Input className="h-9" value={s.videoUrl || ""} onChange={(e) => onChange({ videoUrl: e.target.value })} placeholder="YouTube, Vimeo or Drive link" />
        </div>
      )}

      {hasGallery && (
        <div className="space-y-1.5">
          <Label className="text-xs">Images</Label>
          <div className="flex flex-wrap items-center gap-2">
            {(s.images || []).map((src, i) => (
              <span key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-12 w-20 rounded object-cover" />
                <button onClick={() => onChange({ images: (s.images || []).filter((_, j) => j !== i) })}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-ink p-0.5 text-cream"><X className="h-3 w-3" /></button>
              </span>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => pickImage("gallery")} disabled={uploading === "gallery"}>
              {uploading === "gallery" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add
            </Button>
          </div>
        </div>
      )}

      {hasList && (
        <div className="space-y-2">
          <Label className="text-xs">{s.type === "testimonials" ? "Testimonials" : s.type === "cards" ? "Cards" : "Items"}</Label>
          {(s.items || []).map((it, i) => (
            <div key={it.id} className="space-y-1.5 rounded-md border border-ink/10 p-2">
              {(s.type === "testimonials" || s.type === "cards" || s.type === "feature") && (
                <Input className="h-8" value={it.title || ""} onChange={(e) => {
                  const items = [...(s.items || [])]; items[i] = { ...it, title: e.target.value }; onChange({ items });
                }} placeholder={s.type === "testimonials" ? "Student name" : "Title"} />
              )}
              <Textarea rows={2} value={it.body || ""} onChange={(e) => {
                const items = [...(s.items || [])]; items[i] = { ...it, body: e.target.value }; onChange({ items });
              }} placeholder="Text" />
              {s.type === "cards" && (
                <div className="flex items-center gap-2">
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt="" className="h-10 w-16 rounded object-cover" />
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={() => pickImage(`item-${i}`)} disabled={uploading === `item-${i}`}>
                    {uploading === `item-${i}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />} Image
                  </Button>
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={() => onChange({ items: (s.items || []).filter((_, j) => j !== i) })} className="text-xs text-ink/45 underline hover:text-destructive">Remove</button>
              </div>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({
            items: [...(s.items || []), { id: `i-${Math.random().toString(36).slice(2, 8)}`, title: "", body: "" }],
          })}>
            <Plus className="h-3.5 w-3.5" /> Add item
          </Button>
        </div>
      )}

      {hasCta && (
        <div className="space-y-2 rounded-md border border-ink/10 bg-ink/[0.02] p-2.5">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink/55">
            <MousePointerClick className="h-3.5 w-3.5" /> Button
          </p>
          <Input className="h-8" value={s.cta?.label || ""} onChange={(e) => onChange({ cta: { ...(s.cta || {}), label: e.target.value } })} placeholder="Button text (empty hides it)" />
          <div className="space-y-1">
            <Label className="text-[11px] text-ink/55">Links to</Label>
            <select
              className="h-8 w-full rounded-md border border-ink/15 bg-white px-2 text-xs"
              value={s.cta?.url ? "__url" : s.cta?.courseId || courseId}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__url") onChange({ cta: { ...(s.cta || { label: "" }), url: "https://", courseId: undefined } });
                else onChange({ cta: { ...(s.cta || { label: "" }), courseId: v, url: undefined } });
              }}
            >
              <option value={courseId}>This course</option>
              {courses.filter((c) => c.id !== courseId).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              <option value="__url">A custom link</option>
            </select>
            {s.cta?.url !== undefined && (
              <Input className="h-8" value={s.cta.url} onChange={(e) => onChange({ cta: { ...(s.cta || { label: "" }), url: e.target.value } })} placeholder="https://" />
            )}
          </div>
        </div>
      )}
    </>
  );
}
