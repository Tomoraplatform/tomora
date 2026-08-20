"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { TIKTOK_PIXEL_ID, isTomoraHost } from "@/lib/tiktok/config";

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
 * TikTok base pixel.
 *
 * The host check runs in the browser rather than on the server so the marketing
 * pages stay statically rendered: reading headers in the root layout would make
 * every page dynamic and undo the work that made them fast.
 *
 * Tomora is a single app serving both its own site and every customer's shop,
 * so without this check the pixel would load on all of them.
 */
export function TikTokPixel() {
  const [allowed, setAllowed] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams();
  const firstPage = useRef(true);

  useEffect(() => {
    setAllowed(isTomoraHost(window.location.hostname));
  }, []);

  // The App Router changes pages without reloading, so the pixel's own initial
  // page() call is the only one it would ever make. Every later view is ours.
  useEffect(() => {
    if (!allowed) return;
    if (firstPage.current) { firstPage.current = false; return; }
    window.ttq?.page();
  }, [allowed, pathname, search]);

  if (!allowed) return null;

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${TIKTOK_PIXEL_ID}');
  ttq.page();
}(window, document, 'ttq');`}
    </Script>
  );
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
