"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2, CircleCheck } from "lucide-react";

export function FeedbackForm({
  moduleId,
  moduleHref,
}: {
  moduleId: string;
  moduleHref: string;
}) {
  const router = useRouter();
  const [biggestTakeaway, setBiggestTakeaway] = useState("");
  const [whereStuck, setWhereStuck] = useState("");
  const [questionForExpert, setQuestionForExpert] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/feedback/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          biggestTakeaway,
          whereStuck,
          questionForExpert,
        }),
      });
      const data = await res.json();
      if (data.ok || data.alreadySubmitted) {
        setDone(true);
        router.refresh();
        return;
      }
      setError(data.message || "Feedback submission failed. Please try again.");
    } catch {
      setError("Feedback submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf2e6] text-success">
          <CircleCheck size={30} />
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-tight">
          Thank you. Your response has been received.
        </h2>
        <p className="mt-2 text-muted">
          Your reflection has been shared with the Expert.
        </p>
        <Link
          href={moduleHref}
          className={buttonVariants({ size: "lg" }) + " mt-6"}
        >
          Back to module
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8"
    >
      {error && <Alert tone="error">{error}</Alert>}

      <div>
        <Label htmlFor="takeaway">Biggest takeaway</Label>
        <Textarea
          id="takeaway"
          required
          placeholder="What's the one thing that stuck with you?"
          value={biggestTakeaway}
          onChange={(e) => setBiggestTakeaway(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="stuck">Where are you stuck?</Label>
        <Textarea
          id="stuck"
          placeholder="Anything unclear or holding you back? (optional)"
          value={whereStuck}
          onChange={(e) => setWhereStuck(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="question">Question for the Expert</Label>
        <Input
          id="question"
          placeholder="Ask one question you'd love answered (optional)"
          value={questionForExpert}
          onChange={(e) => setQuestionForExpert(e.target.value)}
          disabled={loading}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Submitting…
          </>
        ) : (
          "Submit feedback"
        )}
      </Button>
    </form>
  );
}
