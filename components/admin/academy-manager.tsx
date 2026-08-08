"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Loader2, UploadCloud, Video, FileText, Check, Eye, EyeOff, GraduationCap, UserPlus, UserMinus, Tag, Star,
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
  grantAccess, revokeAccess,
  createCoupon, setCouponActive, deleteCoupon, addReview, deleteReview, removeNotify,
} from "@/app/admin/academy/actions";
import type { CourseWithContent, AcademyReview } from "@/lib/academy/db";

const MEDIA_BUCKET = "academy-media";
const THUMB_BUCKET = "academy-thumbnails";

export type CourseRoster = Record<string, { enrollmentId: string; name: string; email: string; source: string; createdAt: string }[]>;
export type ReviewsByCourse = Record<string, AcademyReview[]>;
export type WaitlistByCourse = Record<string, { id: string; email: string; createdAt: string }[]>;
export interface AdminCoupon {
  id: string; code: string; discount_type: string; discount_value: number;
  course_id: string | null; max_uses: number | null; used_count: number; active: boolean; expires_at: string | null;
}

type RunFn = (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;

export function AcademyManager({ courses, roster = {}, coupons = [], reviews = {}, waitlist = {} }: {
  courses: CourseWithContent[]; roster?: CourseRoster; coupons?: AdminCoupon[]; reviews?: ReviewsByCourse; waitlist?: WaitlistByCourse;
}) {
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
        <CourseCard key={c.id} course={c} students={roster[c.id] || []} reviews={reviews[c.id] || []} waitlist={waitlist[c.id] || []} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} run={run} busy={busy} />
      ))}

      <CouponsSection coupons={coupons} courses={courses} run={run} busy={busy} />
    </div>
  );
}

function CouponsSection({ coupons, courses, run, busy }: { coupons: AdminCoupon[]; courses: CourseWithContent[]; run: RunFn; busy: string | null }) {
  const [form, setForm] = useState({ code: "", discountType: "percent" as "percent" | "fixed", discountValue: 10, courseId: "", maxUses: "", expiresAt: "" });
  const courseName = (id: string | null) => id ? (courses.find((c) => c.id === id)?.title || "a course") : "All courses";

  async function create() {
    const ok = await run("new-coupon", () => createCoupon({
      code: form.code, discountType: form.discountType, discountValue: Number(form.discountValue) || 0,
      courseId: form.courseId || null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
    }));
    if (ok) setForm({ code: "", discountType: "percent", discountValue: 10, courseId: "", maxUses: "", expiresAt: "" });
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-ink/60" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink/60">Discount coupons</h3>
        </div>

        <div className="grid gap-3 rounded-lg border border-ink/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Code"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="STUDENT20" /></Field>
          <Field label="Type">
            <select className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as "percent" | "fixed" })}>
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (₦)</option>
            </select>
          </Field>
          <Field label={form.discountType === "percent" ? "Percent off" : "Naira off"}><Input type="number" min={0} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} /></Field>
          <Field label="Applies to">
            <select className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">All courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Field>
          <Field label="Max uses (optional)"><Input type="number" min={0} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Unlimited" /></Field>
          <Field label="Expires (optional)"><Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button size="sm" onClick={create} disabled={busy === "new-coupon" || !form.code.trim()}>
              {busy === "new-coupon" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create coupon
            </Button>
          </div>
        </div>

        {coupons.length === 0 ? (
          <p className="text-sm text-ink/50">No coupons yet.</p>
        ) : (
          <div className="divide-y divide-ink/5 rounded-lg border border-ink/10 bg-white">
            {coupons.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <span className="rounded bg-ink/5 px-2 py-1 font-mono text-sm font-bold text-ink">{c.code}</span>
                <span className="text-sm text-ink/70">{c.discount_type === "fixed" ? `₦${c.discount_value.toLocaleString()} off` : `${c.discount_value}% off`}</span>
                <span className="text-xs text-ink/45">{courseName(c.course_id)}</span>
                <span className="text-xs text-ink/45">{c.used_count}{c.max_uses != null ? `/${c.max_uses}` : ""} used{c.expires_at ? ` · exp ${new Date(c.expires_at).toLocaleDateString()}` : ""}</span>
                <div className="ml-auto flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-ink/60"><Switch checked={c.active} onCheckedChange={(v) => run(`cpt-${c.id}`, () => setCouponActive(c.id, v))} /> {c.active ? "Active" : "Off"}</label>
                  <button className="text-ink/40 hover:text-destructive" onClick={() => { if (window.confirm(`Delete coupon ${c.code}?`)) run(`cpd-${c.id}`, () => deleteCoupon(c.id)); }}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CourseCard({
  course, students, reviews, waitlist, open, onToggle, run, busy,
}: {
  course: CourseWithContent;
  students: CourseRoster[string];
  reviews: AcademyReview[];
  waitlist: WaitlistByCourse[string];
  open: boolean;
  onToggle: () => void;
  run: (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;
  busy: string | null;
}) {
  const [form, setForm] = useState({
    title: course.title, slug: course.slug, short_description: course.short_description || "",
    price: course.price, compare_price: course.compare_price || 0,
    thumbnail_url: course.thumbnail_url || "",
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
            <Field label="Slash price (₦, optional)"><Input type="number" min={0} value={form.compare_price ?? ""} onChange={(e) => setForm({ ...form, compare_price: Math.max(0, Math.round(Number(e.target.value) || 0)) })} onBlur={() => updateCourse(course.id, { compare_price: form.compare_price || 0 })} /></Field>
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

          {/* coming soon */}
          <div className="space-y-3 border-t border-ink/10 pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <Switch checked={!!course.is_coming_soon} onCheckedChange={(v) => run(`soon-${course.id}`, () => updateCourse(course.id, { is_coming_soon: v }))} />
                Coming soon (students join a notify list instead of buying)
              </label>
              {course.is_coming_soon && (
                <div className="flex items-center gap-2 text-sm text-ink/60">
                  Lessons shown:
                  <Input type="number" min={0} className="h-8 w-24" defaultValue={course.coming_soon_lessons || 0}
                    onBlur={(e) => updateCourse(course.id, { coming_soon_lessons: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
                </div>
              )}
            </div>
            {(course.is_coming_soon || waitlist.length > 0) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Notify list ({waitlist.length})</p>
                {waitlist.length === 0 ? (
                  <p className="mt-1 text-sm text-ink/50">No emails yet. They&apos;ll appear here when students sign up to be notified.</p>
                ) : (
                  <div className="mt-2 divide-y divide-ink/5 rounded-lg border border-ink/10 bg-white">
                    {waitlist.map((w) => (
                      <div key={w.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="truncate text-sm text-ink">{w.email}</span>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-xs text-ink/40">{new Date(w.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <button className="text-ink/40 hover:text-destructive" title="Remove"
                            onClick={() => { if (window.confirm(`Remove ${w.email} from the notify list?`)) run(`rmn-${w.id}`, () => removeNotify(w.id)); }}>
                            {busy === `rmn-${w.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* student access */}
          <StudentsPanel courseId={course.id} students={students} run={run} busy={busy} />

          {/* reviews */}
          <ReviewsPanel courseId={course.id} reviews={reviews} run={run} busy={busy} />

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

function StudentsPanel({
  courseId, students, run, busy,
}: {
  courseId: string;
  students: CourseRoster[string];
  run: (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;
  busy: string | null;
}) {
  const [email, setEmail] = useState("");

  async function grant() {
    const value = email.trim();
    if (!value) return;
    const ok = await run(`grant-${courseId}`, () => grantAccess(courseId, value));
    if (ok) setEmail("");
  }

  return (
    <div className="space-y-3 border-t border-ink/10 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Students with access ({students.length})</p>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="email"
          placeholder="student@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") grant(); }}
          className="h-9 w-full max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={grant} disabled={busy === `grant-${courseId}` || !email.trim()}>
          {busy === `grant-${courseId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Grant access
        </Button>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-ink/50">No students have access to this course yet.</p>
      ) : (
        <div className="divide-y divide-ink/5 rounded-lg border border-ink/10 bg-white">
          {students.map((s) => (
            <div key={s.enrollmentId} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                <p className="truncate text-xs text-ink/50">{s.email}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                s.source === "purchase" ? "bg-emerald-100 text-emerald-700" : s.source === "admin" ? "bg-blue-100 text-blue-700" : "bg-ink/10 text-ink/60"
              }`}>
                {s.source}
              </span>
              <span className="hidden text-xs text-ink/40 sm:block">{new Date(s.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
              <button
                title="Remove access"
                className="text-ink/40 hover:text-destructive disabled:opacity-50"
                disabled={busy === `revoke-${s.enrollmentId}`}
                onClick={() => { if (window.confirm(`Remove ${s.name}'s access to this course?`)) run(`revoke-${s.enrollmentId}`, () => revokeAccess(s.enrollmentId)); }}
              >
                {busy === `revoke-${s.enrollmentId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-xs font-medium text-ink/60">{label}</label>{children}</div>;
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star`}>
          <Star className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-ink/20"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewsPanel({ courseId, reviews, run, busy }: {
  courseId: string; reviews: AcademyReview[]; run: RunFn; busy: string | null;
}) {
  const [form, setForm] = useState({ authorName: "", rating: 5, body: "" });

  async function add() {
    if (!form.authorName.trim()) return;
    const ok = await run(`addrev-${courseId}`, () => addReview({ courseId, authorName: form.authorName, rating: form.rating, body: form.body }));
    if (ok) setForm({ authorName: "", rating: 5, body: "" });
  }

  return (
    <div className="space-y-3 border-t border-ink/10 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Reviews ({reviews.length})</p>

      <div className="space-y-3 rounded-lg border border-ink/10 bg-white p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Student name"><Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} placeholder="e.g. Ada O." /></Field>
          <Field label="Rating"><StarPicker value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} /></Field>
        </div>
        <Field label="Review"><Textarea rows={2} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="What the student said…" /></Field>
        <Button size="sm" onClick={add} disabled={busy === `addrev-${courseId}` || !form.authorName.trim()}>
          {busy === `addrev-${courseId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add review
        </Button>
      </div>

      {reviews.length > 0 && (
        <div className="divide-y divide-ink/5 rounded-lg border border-ink/10 bg-white">
          {reviews.map((r) => (
            <div key={r.id} className="flex items-start gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{r.author_name}</span>
                  <span className="flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-ink/15"}`} />)}</span>
                </div>
                {r.body && <p className="mt-0.5 text-sm text-ink/60">{r.body}</p>}
              </div>
              <button className="shrink-0 text-ink/40 hover:text-destructive" onClick={() => { if (window.confirm(`Delete this review from ${r.author_name}?`)) run(`delrev-${r.id}`, () => deleteReview(r.id)); }}>
                {busy === `delrev-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
