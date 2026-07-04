"use client";

import { useEffect } from "react";

/** Fires one visit ping per browser session for a live site. */
export function VisitBeacon({ siteId }: { siteId: string }) {
  useEffect(() => {
    if (!siteId) return;
    const key = `tv_${siteId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — still count once per load */
    }
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId }),
      keepalive: true,
    }).catch(() => {});
  }, [siteId]);
  return null;
}
