import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { WhatsAppCard } from "@/components/whatsapp-card";
import { ProgressBar } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { getStudentContext } from "@/lib/student-data";
import { getSettings } from "@/lib/settings";
import { overallProgress, nextLessonTarget } from "@/lib/course";
import { PartyPopper, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Course complete" };

export default async function CompletePage() {
  const ctx = await getStudentContext();
  const settings = await getSettings();
  const allLessons = ctx.modules.flatMap((m) => m.lessons);
  const progress = overallProgress(allLessons, ctx.completedIds);
  const isComplete = progress.total > 0 && progress.percent === 100;
  const target = nextLessonTarget(ctx.modules, ctx.completedIds);
  const firstName = ctx.student.full_name.split(" ")[0];

  return (
    <div className="min-h-screen">
      <AppHeader email={ctx.student.email} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {isComplete ? (
          <>
            <div className="rounded-3xl border border-line bg-surface p-8 text-center shadow-lift sm:p-10">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
                <PartyPopper size={34} />
              </span>
              <h1 className="mt-5 font-editorial text-3xl font-semibold tracking-tight sm:text-4xl">
                Congratulations, {firstName}!
              </h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted">
                You've completed Make Extra Income with Claude AI. Now it's time
                to implement, refine, and monetize your online presence.
              </p>

              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Course progress</span>
                  <span className="text-sm font-bold text-success">100%</span>
                </div>
                <ProgressBar value={100} className="mt-2.5" />
              </div>
            </div>

            <div className="mt-8">
              <WhatsAppCard href={settings.whatsappLink} />
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-line bg-surface p-8 text-center shadow-card sm:p-10">
            <h1 className="font-editorial text-2xl font-semibold tracking-tight sm:text-3xl">
              You're almost there
            </h1>
            <p className="mx-auto mt-3 max-w-md text-muted">
              You've completed {progress.completed} of {progress.total} lessons
              ({progress.percent}%). Finish the remaining lessons to unlock your
              completion page.
            </p>
            <div className="mt-6">
              <ProgressBar value={progress.percent} />
            </div>
            <Link
              href={
                target
                  ? `/course/${target.moduleId}/${target.lessonId}`
                  : "/dashboard"
              }
              className={buttonVariants({ size: "lg" }) + " mt-7"}
            >
              Continue where you stopped <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
