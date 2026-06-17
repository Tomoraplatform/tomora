import * as React from "react";
import { cn } from "@/lib/utils";
import { Info, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

type Tone = "info" | "success" | "error" | "warning";

const tones: Record<Tone, { wrap: string; Icon: typeof Info }> = {
  info: { wrap: "bg-accent-soft/60 border-accent/25 text-accent-dark", Icon: Info },
  success: { wrap: "bg-[#eaf2e6] border-[#cfe2c6] text-success", Icon: CircleCheck },
  error: { wrap: "bg-[#f7e6e1] border-[#e7c5ba] text-error", Icon: CircleAlert },
  warning: { wrap: "bg-[#f8efd8] border-[#e8d6a3] text-warning", Icon: TriangleAlert },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { wrap, Icon } = tones[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        wrap,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" size={18} />
      <div className="leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
    </div>
  );
}
