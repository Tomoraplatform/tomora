"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Loader2, UploadCloud, Video, FileText, Check, Eye, EyeOff, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/utils";
import {
  createCourse, updateCourse, deleteCourse, addModule, updateModule, deleteModule,
  addLesson, updateLesson, deleteLesson, getMediaUploadUrl, getThumbnailUploadUrl,
} from "@/app/admin/academy/actions";
import type { CourseWithContent } from "@/lib/academy/db";

const MEDIA_BUCKET = "academy-media";
const THUMB_BUCKET = "academy-thumbnails";

export function AcademyManager({ courses }: { courses: CourseWithContent[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(courses[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const refresh = () => router.refresh();

  async function run(key: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (!res.ok) { window.alert(res.error || "Something went wrong."); return false; }
    refresh();
    return true;
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => run("new", async () => { const r = await createCourse({ title: "Untitled course" }); if (r.ok && r.id) setOpenId(r.id); return r; })}
        disabled={busy === "new"}
      >
        {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} New course
      </Button>

      {courses.length === 0 && <p className="text-sm text-ink/50">No courses yet. Create your first one.</p>}

      {courses.map((c) => (
        <CourseCard key={c.id} course={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} run={run} busy={busy} />
      ))}
    </div>
  );
}

function CourseCard({
  course, open, onToggle, run, busy,
}: {
  course: CourseWithContent;
  open: boolean;
  onToggle: () => void;
  run: (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;
  busy: string | null;
}) {
  const [form, setForm] = useState({
    title: course.title, slug: course.slug, short_description: course.short_description || "",
    price: course.price, thumbnail_url: course.thumbnail_url || "",
  });
  const [thumbBusy, setThumbBusy] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);

  async function uploadThumb(file?: File) {
    if (!file) return;
    setThumbBusy(true);
    try {
      const meta = await getThumbnailUploadUrl(file.name.split(".").pop() || "jpg");
      if (!meta.ok || !meta.path || !meta.token) throw new Error(meta.error);
      const { error } = await createClient().storage.from(THUMB_BUCKET).uploadToSignedUrl(meta.path, meta.token, file);
      if (error) throw error;
      setForm((f) => ({ ...f, thumbnail_url: meta.publicUrl! }));
      await updateCourse(course.id, { thumbnail_url: meta.publicUrl });
    } catch (e: any) { window.alert(e.message || "Upload failed."); }
    finally { setThumbBusy(false); }
  }

  return (
    <Card>
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
          {open ? <ChevronDown className="h-4 w-4 text-ink/40" /> : <ChevronRight className="h-4 w-4 text-ink/40" />}
          <span className="flex h-11 w-16 items-center justify-center overflow-hidden rounded-md bg-ink/5">
            {form.thumbnail_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={form.thumbnail_url} alt="" className="h-full w-full object-cover" />
              : <GraduationCap className="h-5 w-5 text-ink/30" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{form.title}</span>
            <span className="text-xs text-ink/50">{course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"} · {course.price > 0 ? formatNaira(course.price) : "Free"}</span>
          </span>
        </button>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${course.is_published ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink/60"}`}>
          {course.is_published ? "Published" : "Draft"}
        </span>
        <Switch
          checked={course.is_published}
          onCheckedChange={(v) => run(`pub-${course.id}`, () => updateCourse(course.id, { is_published: v }))}
        />
      </div>

      {open && (
        <CardContent className="space-y-5 border-t border-ink/10 pt-5">
          {/* course fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onBlur={() => updateCourse(course.id, { title: form.title })} /></Field>
            <Field label="URL slug (/academy/…)"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} onBlur={() => updateCourse(course.id, { slug: form.slug })} /></Field>
            <Field label="Price (₦, 0 = free)"><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Math.max(0, Math.round(Number(e.target.value) || 0)) })} onBlur={() => updateCourse(course.id, { price: form.price })} /></Field>
            <Field label="Thumbnail">
              <div className="flex items-center gap-2">
                <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadThumb(e.target.files?.[0])} />
                <Button type="button" variant="outline" size="sm" onClick={() => thumbRef.current?.click()} disabled={thumbBusy}>
                  {thumbBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} {form.thumbnail_url ? "Replace" : "Upload"}
                </Button>
                {form.thumbnail_url && <span className="text-xs text-emerald-600">✓ set</span>}
              </div>
            </Field>
          </div>
          <Field label="Short description (shown on the catalog card)">
            <Textarea rows={2} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} onBlur={() => updateCourse(course.id, { short_description: form.short_description })} />
          </Field>

          {/* modules + lessons */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Curriculum</p>
            {course.modules.map((m) => <ModuleBlock key={m.id} module={m} courseId={course.id} run={run} busy={busy} />)}
            <Button variant="outline" size="sm" onClick={() => run(`addmod-${course.id}`, () => addModule(course.id, "New module"))} disabled={busy === `addmod-${course.id}`}>
              <Plus className="h-4 w-4" /> Add module
            </Button>
          </div>

          <div className="flex justify-end border-t border-ink/10 pt-4">
            <Button variant="outline" size="sm" className="text-destructive"
              onClick={() => { if (window.confirm(`Delete "${form.title}" and all its content? This can't be undone.`)) run(`del-${course.id}`, () => deleteCourse(course.id)); }}>
              <Trash2 className="h-4 w-4" /> Delete course
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ModuleBlock({
  module, courseId, run, busy,
}: {
  module: CourseWithContent["modules"][number];
  courseId: string;
  run: (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;
  busy: string | null;
}) {
  const [title, setTitle] = useState(module.title);
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
      <div className="flex items-center gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => updateModule(module.id, { title })} className="h-8 flex-1 font-medium" />
        <button className="text-ink/40 hover:text-destructive" onClick={() => { if (window.confirm("Delete this module and its lessons?")) run(`delmod-${module.id}`, () => deleteModule(module.id)); }}><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-2 space-y-2 pl-2">
        {module.lessons.map((l) => <LessonRow key={l.id} lesson={l} run={run} />)}
        <Button variant="ghost" size="sm" className="text-ink/60" onClick={() => run(`addles-${module.id}`, () => addLesson({ moduleId: module.id, courseId, title: "New lesson" }))} disabled={busy === `addles-${module.id}`}>
          <Plus className="h-3.5 w-3.5" /> Add lesson
        </Button>
      </div>
    </div>
  );
}

function LessonRow({
  lesson, run,
}: {
  lesson: CourseWithContent["modules"][number]["lessons"][number];
  run: (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [videoPath, setVideoPath] = useState(lesson.video_path || "");
  const [slidesPath, setSlidesPath] = useState(lesson.slides_path || "");
  const [up, setUp] = useState<{ kind: "video" | "slides"; pct: number } | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const slidesRef = useRef<HTMLInputElement>(null);

  async function upload(kind: "video" | "slides", file?: File) {
    if (!file) return;
    setUp({ kind, pct: 0 });
    try {
      const meta = await getMediaUploadUrl(kind, file.name.split(".").pop() || "bin");
      if (!meta.ok || !meta.path || !meta.token) throw new Error(meta.error);
      const { error } = await createClient().storage.from(MEDIA_BUCKET).uploadToSignedUrl(meta.path, meta.token, file);
      if (error) throw error;
      if (kind === "video") { setVideoPath(meta.path); await updateLesson(lesson.id, { video_path: meta.path }); }
      else { setSlidesPath(meta.path); await updateLesson(lesson.id, { slides_path: meta.path }); }
    } catch (e: any) { window.alert(e.message || "Upload failed."); }
    finally { setUp(null); }
  }

  return (
    <div className="rounded-md bg-ink/[0.03] p-2.5">
      <div className="flex items-center gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => updateLesson(lesson.id, { title })} className="h-8 flex-1 text-sm" />
        <button title={lesson.is_preview ? "Free preview" : "Locked"} onClick={() => run(`prev-${lesson.id}`, () => updateLesson(lesson.id, { is_preview: !lesson.is_preview }))} className={lesson.is_preview ? "text-emerald-600" : "text-ink/30"}>
          {lesson.is_preview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button className="text-ink/40 hover:text-destructive" onClick={() => { if (window.confirm("Delete this lesson?")) run(`delles-${lesson.id}`, () => deleteLesson(lesson.id)); }}><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-1">
        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => upload("video", e.target.files?.[0])} />
        <input ref={slidesRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => upload("slides", e.target.files?.[0])} />
        <button onClick={() => videoRef.current?.click()} disabled={!!up} className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/70 disabled:opacity-50">
          {up?.kind === "video" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />} {videoPath ? "Replace video" : "Upload video"}
        </button>
        {videoPath && up?.kind !== "video" && <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3 w-3" /> video</span>}
        <button onClick={() => slidesRef.current?.click()} disabled={!!up} className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/70 disabled:opacity-50">
          {up?.kind === "slides" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} {slidesPath ? "Replace slides" : "Slides (opt.)"}
        </button>
        {slidesPath && up?.kind !== "slides" && <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3 w-3" /> slides</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-xs font-medium text-ink/60">{label}</label>{children}</div>;
}
