"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  LayoutDashboard,
  Check,
} from "lucide-react";

export function LessonActions({
  lessonId,
  initialCompleted,
  nextHref,
  nextLabel,
}: {
  lessonId: string;
  initialCompleted: boolean;
  nextHref: string | null;
  nextLabel: string;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markComplete() {
    if (completed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/progress/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: true }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || "We couldn't save your progress. Please try again.");
        return;
      }
      setCompleted(true);
      router.refresh();
    } catch {
      setError("We couldn't save your progress. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          onClick={markComplete}
          disabled={loading || completed}
          variant={completed ? "secondary" : "primary"}
          size="lg"
          className={completed ? "border-success/40 text-success" : ""}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Saving…
            </>
          ) : completed ? (
            <>
              <CheckCircle2 size={18} /> Lesson completed
            </>
          ) : (
            <>
              <Check size={18} /> Mark Lesson as Complete
            </>
          )}
        </Button>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "ghost", size: "md" })}
          >
            <LayoutDashboard size={17} /> Back to Dashboard
          </Link>
          {nextHref && (
            <Link
              href={nextHref}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {nextLabel} <ArrowRight size={17} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
