"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Circle, ChevronDown, ChevronRight, ChevronLeft,
  Loader2, PlayCircle, FileText, X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { SupportCard } from "@/components/academy/support-card";
import { SlideViewer } from "@/components/academy/slide-viewer";
import { setLessonComplete } from "@/app/academy/actions";
import type { CourseWithContent } from "@/lib/academy/db";

type Lesson = CourseWithContent["modules"][number]["lessons"][number];

/**
 * Udemy-style course player: video stage + curriculum sidebar. Media is
 * fetched per lesson as short-lived signed URLs from /api/academy/lesson,
 * the private bucket is never exposed directly, and the player blocks
 * download/PiP/context-menu so lessons are watched in-portal only.
 */
export function CoursePlayer({
  course, completedLessonIds, studentName, studentEmail,
}: {
  course: CourseWithContent;
  completedLessonIds: string[];
  studentName: string;
  studentEmail?: string;
}) {
  const flat = useMemo(() => course.modules.flatMap((m) => m.lessons), [course]);
  const firstIncomplete = flat.find((l) => !completedLessonIds.includes(l.id)) || flat[0];

  const [active, setActive] = useState<Lesson | undefined>(firstIncomplete);
  const [done, setDone] = useState<Set<string>>(new Set(completedLessonIds));
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(course.modules.map((m) => m.id)));
  const [media, setMedia] = useState<{ videoUrl: string | null; slidesUrl: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [showSlides, setShowSlides] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadMedia = useCallback(async (lesson: Lesson) => {
    setLoading(true); setMedia(null); setMediaError(null); setShowSlides(false);
    try {
      const res = await fetch(`/api/academy/lesson/${lesson.id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load this lesson.");
      setMedia(data);
    } catch (e: any) {
      setMediaError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (active) loadMedia(active); }, [active, loadMedia]);

  const idx = active ? flat.findIndex((l) => l.id === active.id) : -1;
  const prev = idx > 0 ? flat[idx - 1] : undefined;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : undefined;
  const pct = flat.length ? Math.round((flat.filter((l) => done.has(l.id)).length / flat.length) * 100) : 0;

  async function toggleComplete(lesson: Lesson, value?: boolean) {
    const target = value ?? !done.has(lesson.id);
    setDone((prevSet) => {
      const nextSet = new Set(prevSet);
      if (target) nextSet.add(lesson.id); else nextSet.delete(lesson.id);
      return nextSet;
    });
    await setLessonComplete(lesson.id, target);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#101319] text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0B0E13] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/academy/portal" className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Portal
          </Link>
          <p className="truncate text-sm font-semibold">{course.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-white/60">{pct}%</span>
          </div>
          <button onClick={() => setSidebarOpen((v) => !v)} className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 lg:hidden">
            {sidebarOpen ? "Hide lessons" : "Lessons"}
          </button>
          <span className="hidden text-xs text-white/40 md:block"><Logo tone="cream" withWordmark={false} href={null} /></span>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Stage */}
        <main className="flex-1">
          <div className="relative bg-black">
            {loading && (
              <div className="flex aspect-video items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white/40" /></div>
            )}
            {!loading && mediaError && (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-sm text-white/70">{mediaError}</p>
                {active && <button onClick={() => loadMedia(active)} className="rounded-md bg-white/10 px-4 py-2 text-xs font-semibold">Try again</button>}
              </div>
            )}
            {!loading && !mediaError && media?.videoUrl && (
              <video
                key={media.videoUrl}
                src={media.videoUrl}
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onEnded={() => active && toggleComplete(active, true)}
                className="aspect-video w-full"
                playsInline
                autoPlay
              />
            )}
            {!loading && !mediaError && media && !media.videoUrl && media.slidesUrl && (
              <div className="max-h-[80vh] overflow-y-auto bg-[#0B0E13] px-3 py-4 sm:px-6" onContextMenu={(e) => e.preventDefault()}>
                <div className="mx-auto max-w-4xl">
                  <SlideViewer url={media.slidesUrl} />
                </div>
              </div>
            )}
            {!loading && !mediaError && media && !media.videoUrl && !media.slidesUrl && (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 text-white/50">
                <PlayCircle className="h-10 w-10" />
                <p className="text-sm">No content uploaded for this lesson yet.</p>
              </div>
            )}
          </div>

          {/* Lesson meta + controls */}
          <div className="px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Lesson {idx + 1} of {flat.length}</p>
                <h1 className="mt-1 text-lg font-bold">{active?.title || "Select a lesson"}</h1>
              </div>
              {active && (
                <button
                  onClick={() => toggleComplete(active)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${done.has(active.id) ? "bg-emerald-600 text-white" : "bg-white text-[#101319]"}`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {done.has(active.id) ? "Completed" : "Mark as complete"}
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button disabled={!prev} onClick={() => prev && setActive(prev)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-white/80 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button disabled={!next} onClick={() => next && setActive(next)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-white/80 disabled:opacity-30">
                Next <ChevronRight className="h-4 w-4" />
              </button>
              {media?.slidesUrl && media?.videoUrl && (
                <button onClick={() => setShowSlides((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-white/80">
                  <FileText className="h-4 w-4" /> {showSlides ? "Hide slides" : "View slides"}
                </button>
              )}
            </div>

            {showSlides && media?.slidesUrl && (
              <div className="relative mt-4 max-h-[75vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0B0E13] px-3 py-4 sm:px-5">
                <button onClick={() => setShowSlides(false)} className="absolute right-2 top-2 z-10 rounded-full bg-white/15 p-1.5 text-white" aria-label="Close slides">
                  <X className="h-4 w-4" />
                </button>
                <div className="mx-auto max-w-4xl">
                  <SlideViewer url={media.slidesUrl} />
                </div>
              </div>
            )}

            <p className="mt-6 text-xs text-white/30">Signed in as {studentName} · Lessons stream in your portal and can&apos;t be downloaded.</p>

            <div className="mt-6">
              <SupportCard tone="dark" courseTitle={course.title} studentName={studentName} studentEmail={studentEmail} />
            </div>
          </div>
        </main>

        {/* Curriculum sidebar */}
        <aside className={`w-full shrink-0 border-t border-white/10 bg-[#0B0E13] lg:block lg:w-96 lg:border-l lg:border-t-0 ${sidebarOpen ? "block" : "hidden"}`}>
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-sm font-bold">Course content</p>
            <p className="mt-0.5 text-xs text-white/50">{course.modules.length} modules · {flat.length} lessons</p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pb-8 lg:max-h-[calc(100vh-120px)]">
            {course.modules.map((m, mi) => {
              const open = openModules.has(m.id);
              const doneCount = m.lessons.filter((l) => done.has(l.id)).length;
              return (
                <div key={m.id} className="border-b border-white/5">
                  <button
                    onClick={() => setOpenModules((s) => { const n = new Set(s); if (open) n.delete(m.id); else n.add(m.id); return n; })}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
                  >
                    <span>
                      <span className="block text-sm font-semibold">Module {mi + 1}: {m.title}</span>
                      <span className="text-xs text-white/40">{doneCount}/{m.lessons.length} completed</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && m.lessons.map((l) => {
                    const isActive = active?.id === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => { setActive(l); setSidebarOpen(false); }}
                        className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition ${isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
                      >
                        {done.has(l.id)
                          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          : <Circle className="h-4 w-4 shrink-0 text-white/25" />}
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                        {isActive && <PlayCircle className="h-4 w-4 shrink-0 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
