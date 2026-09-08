"use client";

import { useEffect } from "react";

/**
 * Scrolls to the section named in the URL hash.
 *
 * The browser acts on the hash the moment it has a document, and the marketing
 * page is long: FAQ sits about eleven thousand pixels down. On a first load
 * there is nothing at that id yet, the browser finds nothing to scroll to, and
 * the App Router never tries again, so the visitor is left at the top wondering
 * what the link did.
 *
 * Arriving from another page is the ordinary case for these links, not an edge
 * one: every one of them in the nav and footer is written as `/#section`.
 *
 * So re-align while the target is still moving, which it does as images and
 * client components below the fold finish rendering, and stop as soon as its
 * position settles. Stopping on a stable position also means a visitor who
 * scrolls away is left alone rather than yanked back.
 */
export function HashScroll() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;

      // Two budgets. Waiting for the section to exist is generous, because on a
      // slow connection the page can take many seconds to render this far down
      // and giving up early is the bug being fixed. Re-aligning afterwards is
      // short, because by then it is only settling.
      let waited = 0;
      let tries = 0;
      let lastTop: number | null = null;

      const tick = () => {
        const el = document.getElementById(id);
        if (!el) {
          if (++waited < 150) timer = setTimeout(tick, 100); // up to ~15s
          return;
        }
        const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
        if (top !== lastTop) {
          lastTop = top;
          el.scrollIntoView({ block: "start" });
          if (++tries < 25) timer = setTimeout(tick, 120);
        }
        // Position unchanged: the layout has settled, so leave the page alone.
      };

      tick();
    };

    go();
    window.addEventListener("hashchange", go);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("hashchange", go);
    };
  }, []);

  return null;
}
