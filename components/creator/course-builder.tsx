"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Plus, Trash2, UploadCloud, ImageIcon, Video, Link2, FileText,
  ChevronDown, ChevronRight, Eye, EyeOff, ExternalLink, Users, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { APP_DOMAIN } from "@/lib/constants";
import {
  createCreatorCourse, updateCreatorCourse, deleteCreatorCourse,
  addCreatorModule, updateCreatorModule, deleteCreatorModule,
  addCreatorLesson, updateCreatorLesson, deleteCreatorLesson,
} from "@/app/academy/sell/actions";
import { uploadCreatorImage, uploadLessonFile } from "@/lib/creator/client-upload";
import type { CreatorCourseWithContent } from "@/lib/creator/db";

type RunFn = (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;

/** "New course" card: title, description and the compulsory banner. */
export function NewCourseCard({ creatorSlug }: { creatorSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", bannerUrl: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onBanner(file?: File) {
    if (!file) return;
    setUploading(true); setError(null);
    const { url, error: e } = await uploadCreatorImage(file, "banner");
    setUploading(false);
    if (e) { setError(e); return; }
    if (url) setForm((f) => ({ ...f, bannerUrl: url }));
  }

  async function create() {
    setBusy(true); setError(null);
    const res = await createCreatorCourse(form);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Could not create the course."); return; }
    setForm({ title: "", description: "", bannerUrl: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New course</Button>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>New course</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Course title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What will students learn?" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A short summary of the course." />
        </div>
        <div className="space-y-2">
          <Label>Course banner (required)</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink/25 p-4 hover:bg-ink/[0.02]">
            {form.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.bannerUrl} alt="" className="h-16 w-28 rounded object-cover" />
            ) : (
              <span className="flex h-16 w-28 items-center justify-center rounded bg-ink/5 text-ink/40">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
              </span>
            )}
            <span className="text-sm text-ink/60">{form.bannerUrl ? "Click to replace the banner" : "Upload your course banner"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onBanner(e.target.files?.[0])} />
          </label>
          <p className="text-xs text-ink/50">This is what students see on your sales page and in their portal.</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={create} disabled={busy || !form.title.trim() || !form.bannerUrl}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create course
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** One course: details, pricing, curriculum, publish. */
export function CourseCard({ course, creatorSlug, open, onToggle }: {
  course: CreatorCourseWithContent;
  creatorSlug: string;
  open: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: course.title, description: course.description,
    price: course.price, compare_price: course.compare_price ?? 0,
  });

  const run: RunFn = async (key, fn) => {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (!res.ok) { window.alert(res.error || "Something went wrong."); return false; }
    router.refresh();
    return true;
  };

  async function onBanner(file?: File) {
    if (!file) return;
    setUploading(true);
    const { url, error } = await uploadCreatorImage(file, "banner");
    setUploading(false);
    if (error) { window.alert(error); return; }
    if (url) run(`banner-${course.id}`, () => updateCreatorCourse(course.id, { banner_url: url }));
  }

  const salesUrl = `https://${APP_DOMAIN}/c/${creatorSlug}/${course.slug}`;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-ink/40" /> : <ChevronRight className="h-4 w-4 shrink-0 text-ink/40" />}
          <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink/5">
            {course.banner_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={course.banner_url} alt="" className="h-full w-full object-cover" />
              : <ImageIcon className="h-5 w-5 text-ink/30" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{course.title}</span>
            <span className="text-xs text-ink/50">
              {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"} · {course.price > 0 ? formatNaira(course.price) : "Free"} · {course.purchases} sale{course.purchases === 1 ? "" : "s"}
            </span>
          </span>
        </button>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${course.is_published ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink/60"}`}>
          {course.is_published ? "Live" : "Draft"}
        </span>
        {course.featured_at && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">On Tomora Academy</span>
        )}
      </div>

      {open && (
        <CardContent className="space-y-6 border-t border-ink/10 pt-5">
          {/* details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onBlur={() => updateCreatorCourse(course.id, { title: form.title })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Banner</Label>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-ink/15 px-2.5 py-2 text-xs font-medium text-ink/70">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />} Replace
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onBanner(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} onBlur={() => updateCreatorCourse(course.id, { description: form.description })} />
          </div>

          {/* pricing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Price (₦)</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Math.max(0, Number(e.target.value) || 0) })} onBlur={() => updateCreatorCourse(course.id, { price: form.price })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slashed price (₦, optional)</Label>
              <Input type="number" min={0} value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: Math.max(0, Number(e.target.value) || 0) })} onBlur={() => updateCreatorCourse(course.id, { compare_price: form.compare_price || null })} />
            </div>
          </div>

          {/* curriculum */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Curriculum</p>
            {course.modules.map((m) => (
              <ModuleBlock key={m.id} module={m} courseId={course.id} run={run} busy={busy} />
            ))}
            <Button variant="outline" size="sm" onClick={() => run(`addmod-${course.id}`, () => addCreatorModule(course.id, "New module"))} disabled={busy === `addmod-${course.id}`}>
              <Plus className="h-4 w-4" /> Add module
            </Button>
          </div>

          {/* publish + links */}
          <div className="flex flex-wrap items-center gap-4 border-t border-ink/10 pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <Switch checked={course.is_published} onCheckedChange={(v) => run(`pub-${course.id}`, () => updateCreatorCourse(course.id, { is_published: v }))} />
              Sales page live
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <Switch checked={course.is_active} onCheckedChange={(v) => run(`act-${course.id}`, () => updateCreatorCourse(course.id, { is_active: v }))} />
              Course active
            </label>
            <Link href={`/academy/sell/design/${course.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 px-3.5 py-2 text-sm font-semibold text-ink hover:bg-ink/5">
              Design sales page
            </Link>
            {course.is_published && (
              <a href={salesUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 underline hover:text-ink">
                <ExternalLink className="h-3.5 w-3.5" /> View live
              </a>
            )}
            <div className="ml-auto">
              <Button variant="outline" size="sm" className="text-destructive"
                onClick={() => { if (window.confirm(`Delete "${course.title}" and all its lessons? This can't be undone.`)) run(`del-${course.id}`, () => deleteCreatorCourse(course.id)); }}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ModuleBlock({ module, courseId, run, busy }: {
  module: CreatorCourseWithContent["modules"][number];
  courseId: string;
  run: RunFn;
  busy: string | null;
}) {
  const [title, setTitle] = useState(module.title);
  const [adding, setAdding] = useState(false);

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
      <div className="flex items-center gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => updateCreatorModule(module.id, title)} className="h-8 flex-1 font-medium" />
        <button className="text-ink/40 hover:text-destructive" title="Delete module"
          onClick={() => { if (window.confirm("Delete this module and its lessons?")) run(`delmod-${module.id}`, () => deleteCreatorModule(module.id)); }}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 space-y-2 pl-1">
        {module.lessons.map((l, i) => <LessonRow key={l.id} lesson={l} index={i} run={run} busy={busy} />)}

        {adding ? (
          <NewLessonForm courseId={courseId} moduleId={module.id} onDone={() => setAdding(false)} run={run} />
        ) : (
          <Button variant="ghost" size="sm" className="text-ink/60" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add lesson
          </Button>
        )}
      </div>
    </div>
  );
}

const TYPE_META = {
  video: { icon: Video, label: "Video upload" },
  link: { icon: Link2, label: "Video link" },
  pdf: { icon: FileText, label: "PDF" },
} as const;

function NewLessonForm({ courseId, moduleId, onDone, run }: {
  courseId: string; moduleId: string; onDone: () => void; run: RunFn;
}) {
  const [form, setForm] = useState({ title: "", description: "", lessonType: "link" as "video" | "link" | "pdf", mediaUrl: "", mediaPath: "" });
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setUploading(true); setError(null);
    const { path, error: e } = await uploadLessonFile(file, form.lessonType === "pdf" ? "pdf" : "video");
    setUploading(false);
    if (e) { setError(e); return; }
    if (path) setForm((f) => ({ ...f, mediaPath: path }));
  }

  async function save() {
    setBusy(true); setError(null);
    const res = await addCreatorLesson({
      courseId, moduleId, title: form.title, description: form.description,
      lessonType: form.lessonType,
      mediaUrl: form.lessonType === "link" ? form.mediaUrl : undefined,
      mediaPath: form.lessonType === "link" ? undefined : form.mediaPath,
    });
    setBusy(false);
    if (!res.ok) { setError(res.error || "Could not add the lesson."); return; }
    onDone();
    run("noop", async () => ({ ok: true }));
  }

  return (
    <div className="space-y-3 rounded-md border border-ink/15 bg-ink/[0.02] p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Lesson name</Label>
          <Input className="h-9" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Setting up your account" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Lesson type</Label>
          <div className="flex gap-1 rounded-md bg-ink/5 p-1">
            {(["link", "video", "pdf"] as const).map((t) => {
              const { icon: Icon, label } = TYPE_META[t];
              return (
                <button key={t} type="button" onClick={() => setForm({ ...form, lessonType: t, mediaPath: "", mediaUrl: "" })}
                  className={`inline-flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-semibold ${form.lessonType === t ? "bg-white text-ink shadow-sm" : "text-ink/55"}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this lesson covers." />
      </div>

      {form.lessonType === "link" ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Video link</Label>
          <Input className="h-9" value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} placeholder="YouTube (private), Vimeo or Google Drive link" />
          <p className="text-[11px] text-ink/50">Recommended for full lessons. Use an unlisted or private link.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs">{form.lessonType === "pdf" ? "PDF file" : "Video file"} (max 10MB)</Label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-ink/25 p-3 text-sm text-ink/60 hover:bg-white">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {form.mediaPath ? "File uploaded, click to replace" : `Upload ${form.lessonType === "pdf" ? "a PDF" : "a short video"}`}
            <input type="file" accept={form.lessonType === "pdf" ? "application/pdf" : "video/*"} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {form.lessonType === "video" && <p className="text-[11px] text-ink/50">For longer videos, choose &ldquo;Video link&rdquo; instead.</p>}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={busy || !form.title.trim() || (form.lessonType === "link" ? !form.mediaUrl.trim() : !form.mediaPath)}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add lesson
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

function LessonRow({ lesson, index, run, busy }: {
  lesson: CreatorCourseWithContent["modules"][number]["lessons"][number];
  index: number;
  run: RunFn;
  busy: string | null;
}) {
  const [title, setTitle] = useState(lesson.title);
  const { icon: Icon } = TYPE_META[lesson.lesson_type] || TYPE_META.link;

  return (
    <div className="flex items-center gap-2 rounded-md bg-ink/[0.03] p-2.5">
      <span className="w-5 shrink-0 text-center text-xs font-semibold text-ink/40">{index + 1}</span>
      <Icon className="h-4 w-4 shrink-0 text-ink/45" />
      <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => updateCreatorLesson(lesson.id, { title })} className="h-8 flex-1 text-sm" />
      <button title={lesson.is_preview ? "Free preview" : "Locked"} onClick={() => run(`prev-${lesson.id}`, () => updateCreatorLesson(lesson.id, { is_preview: !lesson.is_preview }))}
        className={lesson.is_preview ? "text-emerald-600" : "text-ink/30"}>
        {lesson.is_preview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button className="text-ink/40 hover:text-destructive"
        onClick={() => { if (window.confirm("Delete this lesson?")) run(`delles-${lesson.id}`, () => deleteCreatorLesson(lesson.id)); }}>
        {busy === `delles-${lesson.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
