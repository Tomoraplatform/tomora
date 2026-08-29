"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A background video that costs nothing until someone scrolls to it.
 *
 * Two things were wrong with playing this straight from Cloudinary. The URL
 * pointed at the original upload, so every visitor pulled 9.5MB to fill a box
 * a few hundred pixels wide, and an autoplaying video below the fold is
 * fetched whether or not the visitor ever reaches it. On a Nigerian mobile
 * connection that is the single most expensive thing on the page.
 *
 * So the sources are only attached once the section is close to the viewport,
 * and they ask Cloudinary to resize and re-encode on the way out. The poster
 * shows immediately either way, which is what people actually see first.
 */
export function LazyVideo({
  /** Cloudinary delivery URL of the original upload. */
  src,
  poster,
  className = "",
  /** Rendered width to target. The box is small; the file should be too. */
  width = 720,
}: {
  src: string;
  poster: string;
  className?: string;
  width?: number;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer (or an old browser): just load it rather than show nothing.
    if (typeof IntersectionObserver === "undefined") { setLoad(true); return; }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setLoad(true); io.disconnect(); }
      },
      // Start a little before it comes into view so it is ready on arrival.
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Someone who has asked for less motion should not be served a looping
  // video at all; the poster alone carries the same picture.
  const [still, setStill] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(m.matches);
    const on = () => setStill(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      poster={transform(poster, `so_2,f_auto,q_auto,w_${width},c_limit`)}
      className={className}
    >
      {load && !still && (
        <>
          {/* WebM first: a fifth of the MP4, and most browsers take it. */}
          <source src={transform(src, `f_webm,vc_auto,q_auto,w_${width},c_limit`)} type="video/webm" />
          <source src={transform(src, `f_mp4,vc_auto,q_auto,w_${width},c_limit`)} type="video/mp4" />
        </>
      )}
    </video>
  );
}

/**
 * Inserts Cloudinary transformations into a delivery URL.
 *
 * Returns the URL untouched if it is not a Cloudinary one, so a hand-edited
 * link still renders rather than breaking.
 */
function transform(url: string, ops: string): string {
  const marker = "/upload/";
  const at = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || at === -1) return url;
  const head = url.slice(0, at + marker.length);
  let tail = url.slice(at + marker.length);
  // Drop transformations already in the URL (the poster carries its own so_2).
  tail = tail.replace(/^(?:[a-z]{1,3}_[^/,]+(?:,[a-z]{1,3}_[^/,]+)*\/)+/i, "");
  return `${head}${ops}/${tail}`;
}
