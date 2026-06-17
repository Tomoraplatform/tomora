"use client";

import { Card, CardBody } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { FeedbackRow } from "@/components/admin/admin-dashboard";
import { MessageSquareText } from "lucide-react";

export function AdminFeedback({ feedback }: { feedback: FeedbackRow[] }) {
  if (feedback.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-center py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
              <MessageSquareText size={24} />
            </span>
            <p className="mt-4 font-semibold">No feedback yet</p>
            <p className="mt-1 text-sm text-muted">
              Module reflections from students will appear here.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map((f) => (
        <Card key={f.id}>
          <CardBody>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold tracking-tight">{f.studentName}</p>
                <p className="text-xs text-muted">{f.studentEmail}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-dark">
                  Module {f.moduleOrder} · {f.moduleTitle}
                </span>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(f.createdAt)}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-charcoal">Biggest takeaway</dt>
                <dd className="mt-0.5 text-muted">{f.biggestTakeaway}</dd>
              </div>
              <div>
                <dt className="font-semibold text-charcoal">Where they're stuck</dt>
                <dd className="mt-0.5 text-muted">{f.whereStuck || "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-charcoal">
                  Question for the Expert
                </dt>
                <dd className="mt-0.5 text-muted">
                  {f.questionForExpert || "—"}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
