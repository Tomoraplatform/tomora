import * as React from "react";
import { cn } from "@/lib/utils";
import type { ModuleStatus } from "@/lib/constants";

const statusStyles: Record<string, string> = {
  "Not Started": "bg-surface-warm text-muted border-line",
  "In Progress": "bg-accent-soft text-accent-dark border-accent/30",
  Completed: "bg-[#eaf2e6] text-success border-[#cfe2c6]",
};

export function StatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-warm px-2.5 py-1 text-xs font-semibold text-muted",
        className,
      )}
      {...props}
    />
  );
}
