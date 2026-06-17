import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { LessonVideo } from "@/components/lesson-video";
import { PdfViewer } from "@/components/pdf-viewer";
import { LessonActions } from "@/components/lesson-actions";
import { buttonVariants } from "@/components/ui/button";
import { getStudentContext } from "@/lib/student-data";
import { lessonNeighbors } from "@/lib/course";
import { MessageSquareText, FileText } from "lucide-react";

export default async function LessonPage({
  params,
}: {
  params: { moduleId: string; lessonId: string };
}) {
  const ctx = await getStudentContext();
  const mod = ctx.modules.find((m) => m.id === params.moduleId);
  if (!mod) notFound();
  const lessonIdx = mod.lessons.findIndex((l) => l.id === params.lessonId);
  if (lessonIdx === -1) notFound();
  const lesson = mod.lessons[lessonIdx];

  const completed = ctx.completedIds.has(lesson.id);
  const { next } = lessonNeighbors(ctx.modules, lesson.id);
  const nextHref = next
    ? `/course/${next.module_id}/${next.id}`
    : "/complete";
  const nextLabel = next ? "Next Lesson" : "Finish course";

  const isWorksheet = lesson.lesson_type === "worksheet";
  const hasFeedback = ctx.feedbackModuleIds.has(mod.id);
  const isLastInModule = lessonIdx === mod.lessons.length - 1;
  const isWelcome = mod.module_order === 0;

  return (
    <div className="min-h-screen">
      <AppHeader email={ctx.student.email} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <Link href="/dashboard" className="hover:text-accent-dark">
            Dashboard
          </Link>
          <span className="px-1">/</span>
          <Link href="/course" className="hover:text-accent-dark">
            Course
          </Link>
          <span className="px-1">/</span>
          <Link href={`/course/${mod.id}`} className="hover:text-accent-dark">
            {mod.title}
          </Link>
          <span className="px-1">/</span>
          <span className="text-charcoal">{lesson.title}</span>
        </nav>

        <header className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-dark">
            {isWelcome ? "Start Here" : `Module ${mod.module_order}`} ·{" "}
            {mod.title}
          </p>
          <h1 className="mt-1.5 font-editorial text-3xl font-semibold tracking-tight sm:text-4xl">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">
              {lesson.description}
            </p>
          )}
        </header>

        {/* Media */}
        <section className="mt-7">
          {isWorksheet ? (
            <>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface-warm px-3 py-1 text-xs font-semibold text-muted">
                <FileText size={14} /> Worksheet · view only
              </div>
              <PdfViewer url={lesson.pdf_view_url || ""} title={lesson.title} />
            </>
          ) : (
            <LessonVideo url={lesson.video_embed_url || ""} title={lesson.title} />
          )}
        </section>

        {/* Secondary worksheet, if a video lesson also has a PDF */}
        {!isWorksheet && lesson.pdf_view_url && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold tracking-tight">
              Worksheet for this lesson
            </h2>
            <PdfViewer url={lesson.pdf_view_url} title={`${lesson.title} worksheet`} />
          </section>
        )}

        {/* Actions */}
        <section className="mt-9 border-t border-line pt-7">
          <LessonActions
            lessonId={lesson.id}
            initialCompleted={completed}
            nextHref={nextHref}
            nextLabel={nextLabel}
          />
        </section>

        {/* End-of-module feedback nudge */}
        {!isWelcome && isLastInModule && !hasFeedback && (
          <section className="mt-8 rounded-2xl border border-accent/25 bg-accent-soft/40 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-accent-dark">
                <MessageSquareText size={20} />
              </span>
              <div className="flex-1">
                <h3 className="font-bold tracking-tight text-accent-dark">
                  You've reached the end of this module
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Take a moment to reflect — share your biggest takeaway and any
                  question for the Expert.
                </p>
              </div>
              <Link
                href={`/module/${mod.id}/feedback`}
                className={buttonVariants({ size: "sm" })}
              >
                Share feedback
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
