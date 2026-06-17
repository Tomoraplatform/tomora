/** Bunny Stream embed. `url` is the iframe embed URL stored per lesson. */
export function LessonVideo({ url, title }: { url: string; title: string }) {
  const isPlaceholder = !url || url.includes("LIBRARY_ID");

  if (isPlaceholder) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-line bg-surface-warm text-center">
        <div className="px-6">
          <p className="font-semibold text-charcoal">Video coming soon</p>
          <p className="mt-1 text-sm text-muted">
            An admin can add the Bunny Stream embed link for this lesson.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black shadow-card">
      <iframe
        src={url}
        title={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
