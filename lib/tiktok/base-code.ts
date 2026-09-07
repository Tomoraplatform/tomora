import { TIKTOK_PIXEL_IDS } from "./config";

/**
 * TikTok's base code, rendered into the HTML of every page.
 *
 * It has to be in the served HTML, not injected later by React: TikTok's Events
 * Manager reads the page's source to confirm the pixel is installed, and a
 * client-mounted snippet is invisible to it.
 *
 * Tomora serves its own site and every customer's shop from one app, so the
 * host check lives inside the script instead. On a seller's storefront the code
 * is present but returns before loading anything: no pixel, no requests, no
 * shopper data. That keeps the pages static too, which reading the host header
 * on the server would have cost.
 */
export function tiktokBaseCode(): string {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "tomora.com.ng";
  return `(function(){
var h=(location.hostname||"").toLowerCase();
var a=${JSON.stringify(appDomain)};
if(!(h===a||h==="www."+a||/\\.vercel\\.app$/.test(h)||h==="localhost"||h==="127.0.0.1"))return;
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
${TIKTOK_PIXEL_IDS.map((id) => `  ttq.load(${JSON.stringify(id)});`).join("\n")}
  ttq.page();
}(window, document, 'ttq');
})();`;
}
