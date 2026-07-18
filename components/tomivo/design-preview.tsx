"use client";

/**
 * Renders a design's self-contained preview HTML inside a sandboxed iframe.
 * `scale` shrinks a full 1280-wide render into a card. The sandbox allows
 * scripts (for particle/animation demos) but nothing else, and the frame
 * can't navigate or access the parent.
 */
export function DesignPreview({
  html, scale = 1, interactive = false, className = "",
}: {
  html: string;
  scale?: number;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <iframe
      title="Design preview"
      srcDoc={html}
      sandbox="allow-scripts"
      loading="lazy"
      scrolling="no"
      className={className}
      style={
        scale === 1
          ? { width: "100%", height: "100%", border: 0, pointerEvents: interactive ? "auto" : "none" }
          : {
              width: `${100 / scale}%`,
              height: `${100 / scale}%`,
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              pointerEvents: interactive ? "auto" : "none",
            }
      }
    />
  );
}
