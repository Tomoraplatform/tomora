"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isTomoraHost } from "@/lib/tiktok/config";

declare global {
  interface Window {
    ttq?: {
      page: () => void;
      track: (event: string, params?: Record<string, unknown>, options?: { event_id?: string }) => void;
      identify: (data: Record<string, unknown>) => void;
    };
  }
}

/**
 * Page views for client-side navigations.
 *
 * The base code in the document head fires the first view. After that the App
 * Router swaps pages without reloading, so every later view is sent here.
 */
export function TikTokPageViews() {
  const pathname = usePathname();
  const search = useSearchParams();
  const firstPage = useRef(true);

  useEffect(() => {
    if (!isTomoraHost(window.location.hostname)) return;
    // The base code already counted the view this component mounted on.
    if (firstPage.current) { firstPage.current = false; return; }
    window.ttq?.page();
  }, [pathname, search]);

  return null;
}

/**
 * Fires one event from the browser.
 *
 * `eventId` must match the id the server sends for the same action, so TikTok
 * counts it once instead of twice. Rendered on the page a flow lands on, and
 * only when that flow actually just happened.
 */
export function TikTokEvent({
  event, eventId, params,
}: {
  event: string;
  eventId: string;
  params?: Record<string, unknown>;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    if (!isTomoraHost(window.location.hostname)) return;
    sent.current = true;
    // The pixel queues calls made before its script finishes loading, so this
    // is safe to call immediately after mount.
    window.ttq?.track(event, params || {}, { event_id: eventId });
  }, [event, eventId, params]);

  return null;
}
