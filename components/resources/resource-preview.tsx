"use client";

/**
 * Frames a resource preview by URL rather than by srcDoc, so the markup never
 * appears in the page that lists it. `scale` shrinks a full desktop render
 * down into a card.
 */
export function ResourcePreview({
  slug,
  scale = 1,
  interactive = false,
  className = "",
}: {
  slug: string;
  scale?: number;
  interactive?: boolean;
  className?: string;
}) {
  const base = {
    border: 0,
    pointerEvents: interactive ? ("auto" as const) : ("none" as const),
  };

  return (
    <iframe
      title="Resource preview"
      src={`/api/resources/${slug}/preview`}
      sandbox="allow-scripts"
      loading="lazy"
      scrolling="no"
      className={className}
      style={
        scale === 1
          ? { ...base, width: "100%", height: "100%" }
          : {
              ...base,
              width: `${100 / scale}%`,
              height: `${100 / scale}%`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }
      }
    />
  );
}
