import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-card">
        <span className="font-editorial text-lg font-semibold leading-none">M</span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight text-charcoal">
            Make Extra Income
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
            with Claude AI
          </span>
        </span>
      )}
    </span>
  );
}
