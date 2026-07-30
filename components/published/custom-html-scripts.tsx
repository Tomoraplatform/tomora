"use client";

import { useEffect, useRef } from "react";

/**
 * Executes the scripts from an uploaded HTML page. Markup injected through
 * innerHTML never runs its scripts, so they're appended here as real <script>
 * elements once the DOM is in place: external sources first (in order), then
 * the inline blocks, matching the original document's order.
 */
export function CustomHtmlScripts({ inline, external }: { inline: string[]; external: string[] }) {
  const done = useRef(false);

  useEffect(() => {
    // Strict mode mounts twice in development; only run once.
    if (done.current) return;
    done.current = true;

    const added: HTMLScriptElement[] = [];

    const runInline = () => {
      for (const code of inline) {
        const el = document.createElement("script");
        el.type = "text/javascript";
        el.text = code;
        document.body.appendChild(el);
        added.push(el);
      }
      // Anything waiting on the document lifecycle: the events already fired
      // before these scripts existed, so replay them.
      document.dispatchEvent(new Event("DOMContentLoaded"));
      window.dispatchEvent(new Event("load"));
    };

    if (!external.length) {
      runInline();
    } else {
      let remaining = external.length;
      const next = () => { if (--remaining === 0) runInline(); };
      for (const src of external) {
        const el = document.createElement("script");
        el.src = src;
        el.async = false;          // preserve execution order
        el.onload = next;
        el.onerror = next;         // a failed CDN shouldn't block the page
        document.body.appendChild(el);
        added.push(el);
      }
    }

    return () => { added.forEach((el) => el.remove()); };
  }, [inline, external]);

  return null;
}
