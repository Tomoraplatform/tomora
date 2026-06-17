import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { WhatsAppCard } from "@/components/whatsapp-card";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { getStudentContext } from "@/lib/student-data";
import { getSettings } from "@/lib/settings";
import {
  overallProgress,
  moduleStatus,
  nextLessonTarget,
} from "@/lib/course";
import {
  ArrowRight,
  PlayCircle,
  FileText,
  CheckCircle2,
  Circle,
  MessageSquareText,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await getStudentContext();
  const settings = await getSettings();

  const allLessons = ctx.modules.flatMap((m) => m.lessons);
  const progress = overallProgress(allLessons, ctx.completedIds);
  const target = nextLessonTarget(ctx.modules, ctx.completedIds);
  const continueHref = target
    ? `/course/${target.moduleId}/${target.lessonId}`
    : "/complete";
  const firstName = ctx.student.full_name.split(" ")[0];

  return (
    <div className="min-h-screen">
      <AppHeader email={ctx.student.email} showDashboardLink={false} />

      <main className="mx-auto max-w-content px-4 py-8 sm:px-6 sm:py-10">
        {/* Welcome + progress */}
        <section className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-dark">
                Welcome back
              </p>
              <h1 className="mt-2 font-editorial text-3xl font-semibold tracking-tight sm:text-4xl">
                Hi {firstName} 👋
              </h1>
              <p className="mt-2 text-muted">
                Make Extra Income with Claude AI
              </p>
            </div>
            <Link
              href={continueHref}
              className={buttonVariants({ size: "lg" }) + " shrink-0"}
            >
              {progress.completed === 0
                ? "Start the course"
                : progress.percent === 100
                  ? "Review & finish"
                  : "Continue where you stopped"}
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-7">
            <div className="flex items-end justify-between">
              <span className="text-sm font-semibold text-charcoal">
                {progress.completed} of {progress.total} lessons completed
              </span>
              <span className="text-sm font-bold text-accent-dark">
                {progress.percent}%
              </span>
            </div>
            <ProgressBar value={progress.percent} className="mt-2.5" />
          </div>
        </section>

        {/* Module cards */}
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">Your modules</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {ctx.modules.map((m, idx) => {
              const status = moduleStatus(m.lessons, ctx.completedIds);
              const done = m.lessons.filter((l) =>
                ctx.completedIds.has(l.id),
              ).length;
              const hasFeedback = ctx.feedbackModuleIds.has(m.id);
              const isWelcome = m.module_order === 0;
              return (
                <Link
                  key={m.id}
                  href={`/course/${m.id}`}
                  className="group flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      {isWelcome ? "Start Here" : `Module ${m.module_order}`}
                    </span>
                    <StatusBadge status={status} />
                  </div>
                  <h3 className="mt-3 text-lg font-bold tracking-tight">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                      {m.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2">
                    {m.lessons.map((l) => {
                      const completed = ctx.completedIds.has(l.id);
                      const Icon =
                        l.lesson_type === "worksheet" ? FileText : PlayCircle;
                      return (
                        <div
                          key={l.id}
                          className="flex items-center gap-2.5 text-sm"
                        >
                          {completed ? (
                            <CheckCircle2 size={16} className="text-success" />
                          ) : (
                            <Circle size={16} className="text-line" />
                          )}
                          <Icon size={15} className="text-muted" />
                          <span
                            className={
                              completed
                                ? "text-muted line-through"
                                : "text-charcoal"
                            }
                          >
                            {l.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="text-xs text-muted">
                      {done}/{m.lessons.length} lessons
                      {!isWelcome && (
                        <span
                          className={
                            "ml-3 inline-flex items-center gap-1 " +
                            (hasFeedback ? "text-success" : "text-muted/70")
                          }
                        >
                          <MessageSquareText size={13} />
                          {hasFeedback ? "Feedback done" : "Feedback open"}
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-dark">
                      Open <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* WhatsApp */}
        <section className="mt-10">
          <WhatsAppCard href={settings.whatsappLink} />
        </section>
      </main>
    </div>
  );
}
