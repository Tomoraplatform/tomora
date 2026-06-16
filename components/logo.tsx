import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Tomora brand logo. Renders the icon mark + wordmark.
 * Drop a real `tomora-logo.png` into /public to swap the mark if desired —
 * this inline SVG keeps the brand consistent without any external asset.
 */
export function Logo({
  className,
  withWordmark = true,
  tone = "ink",
  href = "/",
}: {
  className?: string;
  withWordmark?: boolean;
  tone?: "ink" | "cream";
  href?: string | null;
}) {
  const markBg = tone === "cream" ? "#FAF7F0" : "#022245";
  const markFg = tone === "cream" ? "#022245" : "#FAF7F0";
  const text = tone === "cream" ? "text-cream" : "text-ink";

  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 120 120"
        className="h-9 w-9 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="120" height="120" rx="28" fill={markBg} />
        <path
          d="M34 44c6-12 18-16 30-14 7 1 13 2 18-3 3-3 8-2 10 2v8c-4 7-12 10-21 8 3 18-5 38-19 47-9 6-21 7-27-1-3-4-2-9 2-11 4-2 8 0 9 4 1 3 4 3 7 1 9-7 14-22 11-35-1-5-5-7-9-4-2 1-3 4-6 4-5 1-9-4-7-9z"
          fill={markFg}
        />
      </svg>
      {withWordmark && (
        <span className={cn("text-2xl font-bold tracking-tight", text)}>
          Tomora
        </span>
      )}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  );
}
