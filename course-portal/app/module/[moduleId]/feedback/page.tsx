import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { FeedbackForm } from "@/components/feedback-form";
import { buttonVariants } from "@/components/ui/button";
import { getStudentContext } from "@/lib/student-data";
import { CircleCheck } from "lucide-react";

export default async function FeedbackPage({
  params,
}: {
  params: { moduleId: string };
}) {
  const ctx = await getStudentContext();
  const mod = ctx.modules.find((m) => m.id === params.moduleId);
  if (!mod) notFound();

  const alreadySubmitted = ctx.feedbackModuleIds.has(mod.id);
  const moduleHref = `/course/${mod.id}`;

  return (
    <div className="min-h-screen">
      <AppHeader email={ctx.student.email} />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <Link href="/dashboard" className="hover:text-accent-dark">
            Dashboard
          </Link>
          <span className="px-1">/</span>
          <Link href={moduleHref} className="hover:text-accent-dark">
            {mod.title}
          </Link>
          <span className="px-1">/</span>
          <span className="text-charcoal">Feedback</span>
        </nav>

        <header className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-dark">
            Module {mod.module_order} reflection
          </p>
          <h1 className="mt-1.5 font-editorial text-3xl font-semibold tracking-tight sm:text-4xl">
            Reflect on {mod.title}
          </h1>
          <p className="mt-3 text-muted">
            A few minutes of reflection helps the lessons stick — and lets the
            Expert support you better.
          </p>
        </header>

        <div className="mt-7">
          {alreadySubmitted ? (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf2e6] text-success">
                <CircleCheck size={30} />
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-tight">
                Thank you. Your response has been received.
              </h2>
              <p className="mt-2 text-muted">
                You've already submitted feedback for this module.
              </p>
              <Link
                href={moduleHref}
                className={buttonVariants({ size: "lg" }) + " mt-6"}
              >
                Back to module
              </Link>
            </div>
          ) : (
            <FeedbackForm moduleId={mod.id} moduleHref={moduleHref} />
          )}
        </div>
      </main>
    </div>
  );
}
