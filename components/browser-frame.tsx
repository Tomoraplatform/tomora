import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** A pure-CSS browser chrome window. No external images. */
export function BrowserFrame({
  url = "yourbrand.tomora.com",
  children,
  className,
  bodyClassName,
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-ink/10 bg-white shadow-2xl",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-ink/10 bg-slate-100 px-3 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto flex w-full max-w-xs items-center gap-1.5 rounded-md bg-white px-3 py-1 text-xs text-slate-500">
          <Lock className="h-3 w-3" />
          <span className="truncate">{url}</span>
        </div>
      </div>
      <div className={cn("bg-white", bodyClassName)}>{children}</div>
    </div>
  );
}
