import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { getStudentContext } from "@/lib/student-data";
import { moduleStatus } from "@/lib/course";
import { MODULE_LOCK_MESSAGE } from "@/lib/constants";
import {
  PlayCircle,
  FileText,
  CheckCircle2,
  Circle,
  ChevronRight,
  ArrowRight,
  MessageSquareText,
} from "lucide-react";

export default async function ModulePage({
  params,
}: {
  params: { moduleId: string };
}) {
  const ctx = await getStudentContext();
  const idx = ctx.modules.findIndex((m) => m.id === params.moduleId);
  if (idx === -1) notFound();
  const mod = ctx.modules[idx];

  const status = moduleStatus(mod.lessons, ctx.completedIds);
  const isWelcome = mod.module_order === 0;
  const hasFeedback = ctx.feedbackModuleIds.has(mod.id);

  // Gentle (non-blocking) guidance: is the previous module finished?
  const prev = idx > 0 ? ctx.modules[idx - 1] : null;
  const prevIncomplete =
    prev && moduleStatus(prev.lessons, ctx.completedIds) !== "Completed";

  return (
    <div className="min-h-screen">
      <AppHeader email={ctx.student.email} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <Link href="/dashboard" className="hover:text-accent-dark">
            Dashboard
          </Link>
          <span className="px-1">/</span>
          <Link href="/course" className="hover:text-accent-dark">
            Course
          </Link>
          <span className="px-1">/</span>
          <span className="text-charcoal">{mod.title}</span>
        </nav>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-dark">
              {isWelcome ? "Start Here" : `Module ${mod.module_order}`}
            </p>
            <h1 className="mt-1 font-editorial text-3xl font-semibold tracking-tight sm:text-4xl">
              {mod.title}
            </h1>
          </div>
          <StatusBadge status={status} />
        </div>
        {mod.description && (
          <p className="mt-3 text-muted">{mod.description}</p>
        )}

        {prevIncomplete && (
          <Alert tone="info" className="mt-6">
            {MODULE_LOCK_MESSAGE}{" "}
            <Link
              href={`/course/${prev!.id}`}
              className="font-semibold underline"
            >
              Go to {prev!.title}
            </Link>
          </Alert>
        )}

        {/* Lessons */}
        <ul className="mt-7 space-y-3">
          {mod.lessons.map((l, i) => {
            const completed = ctx.completedIds.has(l.id);
            const Icon = l.lesson_type === "worksheet" ? FileText : PlayCircle;
            return (
              <li key={l.id}>
                <Link
                  href={`/course/${mod.id}/${l.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted">
                      Lesson {i + 1}
                      {l.lesson_type === "worksheet" && " · Worksheet"}
                    </p>
                    <p className="truncate text-[15px] font-semibold text-charcoal">
                      {l.title}
                    </p>
                  </div>
                  {completed ? (
                    <CheckCircle2 size={20} className="text-success" />
                  ) : (
                    <Circle size={20} className="text-line" />
                  )}
                  <ChevronRight size={18} className="text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Module feedback CTA */}
        {!isWelcome && (
          <div className="mt-8 rounded-2xl border border-line bg-surface-warm/50 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                <MessageSquareText size={20} />
              </span>
              <div className="flex-1">
                <h3 className="font-bold tracking-tight">
                  Reflect on this module
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {hasFeedback
                    ? "Thanks — you've already shared your reflection for this module."
                    : "Share your biggest takeaway and any questions for the Expert."}
                </p>
              </div>
              {!hasFeedback && (
                <Link
                  href={`/module/${mod.id}/feedback`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  Feedback <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
