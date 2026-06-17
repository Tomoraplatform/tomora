"use client";

/**
 * View-only worksheet viewer.
 * - No download button is rendered.
 * - PDF toolbar/download controls are hidden via the URL fragment.
 * - Right-click is disabled over the frame.
 * Note: client-side viewers can never make a public file 100% un-downloadable.
 * For stronger protection, store worksheets behind a private/signed URL (see README).
 */
export function PdfViewer({ url, title }: { url: string; title: string }) {
  const isPlaceholder = !url || url.includes("placeholder-worksheet");

  if (isPlaceholder) {
    return (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-2xl border border-dashed border-line bg-surface-warm text-center">
        <div className="px-6">
          <p className="font-semibold text-charcoal">Worksheet coming soon</p>
          <p className="mt-1 text-sm text-muted">
            An admin can add the view-only worksheet link for this lesson.
          </p>
        </div>
      </div>
    );
  }

  // Hide native PDF toolbar / download / print affordances where the browser respects it.
  const viewerUrl = `${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;

  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
        onContextMenu={(e) => e.preventDefault()}
      >
        <iframe
          src={viewerUrl}
          title={title}
          className="pdf-frame h-[70vh] min-h-[420px] w-full"
        />
        {/* Transparent guard strip over the top-right where viewers place download icons */}
        <div className="pointer-events-none absolute right-0 top-0 h-12 w-32" />
      </div>
      <p className="mt-2 text-center text-xs text-muted">
        Worksheet is available to read inside this course portal.
      </p>
    </div>
  );
}
