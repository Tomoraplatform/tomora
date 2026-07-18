"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Renders a PDF slide deck to <canvas> pages with pdf.js. Unlike an <iframe>,
 * this works on mobile browsers (iOS Safari refuses to embed PDFs), scales to
 * the container width, and never exposes a download control.
 */
export function SlideViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const canvases: HTMLCanvasElement[] = [];

    (async () => {
      setStatus("loading");
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        setPageCount(doc.numPages);

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const width = Math.min(container.clientWidth || 800, 1400);

        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return;
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const scale = width / base.width;
          const viewport = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.style.borderRadius = "10px";
          canvas.style.marginBottom = "14px";
          canvas.oncontextmenu = (e) => e.preventDefault();
          container.appendChild(canvas);
          canvases.push(canvas);

          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      canvases.forEach((c) => c.remove());
    };
  }, [url]);

  return (
    <div className="w-full">
      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-white/50">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading slides…
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-white/60">Could not display the slides here.</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-md bg-white/10 px-4 py-2 text-xs font-semibold text-white">
            Open slides in a new tab
          </a>
        </div>
      )}
      <div ref={containerRef} className={status === "ready" ? "block" : "hidden"} />
      {status === "ready" && pageCount > 0 && (
        <p className="pb-2 pt-1 text-center text-xs text-white/30">{pageCount} slide{pageCount === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}
