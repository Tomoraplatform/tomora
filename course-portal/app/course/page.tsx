import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { getStudentContext } from "@/lib/student-data";
import { overallProgress, moduleStatus } from "@/lib/course";
import {
  PlayCircle,
  FileText,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = { title: "Course" };

export default async function CoursePage() {
  const ctx = await getStudentContext();
  const allLessons = ctx.modules.flatMap((m) => m.lessons);
  const progress = overallProgress(allLessons, ctx.completedIds);

  return (
    <div className="min-h-screen">
      <AppHeader email={ctx.student.email} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <nav className="text-sm text-muted">
          <Link href="/dashboard" className="hover:text-accent-dark">
            Dashboard
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-charcoal">Course</span>
        </nav>

        <h1 className="mt-3 font-editorial text-3xl font-semibold tracking-tight sm:text-4xl">
          Course curriculum
        </h1>
        <div className="mt-4 flex items-center gap-4">
          <ProgressBar value={progress.percent} className="max-w-xs" />
          <span className="text-sm font-semibold text-accent-dark">
            {progress.percent}%
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {ctx.modules.map((m) => {
            const status = moduleStatus(m.lessons, ctx.completedIds);
            const isWelcome = m.module_order === 0;
            return (
              <div
                key={m.id}
                className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
              >
                <Link
                  href={`/course/${m.id}`}
                  className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-accent-soft/30"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      {isWelcome ? "Start Here" : `Module ${m.module_order}`}
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold tracking-tight">
                      {m.title}
                    </h2>
                  </div>
                  <StatusBadge status={status} />
                </Link>
                <ul className="divide-y divide-line border-t border-line">
                  {m.lessons.map((l) => {
                    const completed = ctx.completedIds.has(l.id);
                    const Icon =
                      l.lesson_type === "worksheet" ? FileText : PlayCircle;
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/course/${m.id}/${l.id}`}
                          className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-accent-soft/20"
                        >
                          {completed ? (
                            <CheckCircle2 size={18} className="text-success" />
                          ) : (
                            <Circle size={18} className="text-line" />
                          )}
                          <Icon size={16} className="text-muted" />
                          <span
                            className={
                              "flex-1 text-[15px] " +
                              (completed ? "text-muted" : "text-charcoal")
                            }
                          >
                            {l.title}
                          </span>
                          <ChevronRight size={16} className="text-muted" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
