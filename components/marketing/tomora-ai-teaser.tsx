import Link from "next/link";
import { Sparkles, ArrowRight, Copy, Wand2, Eye, LayoutTemplate } from "lucide-react";
import { LazyVideo } from "./lazy-video";

/**
 * Tomora AI section. The visual is the shipping hero from Tomora Resources:
 * the same Cloudinary footage, bottom-left copy and pill CTA, rebuilt inline
 * so the landing page does not depend on a resource row staying published.
 */
export function TomoraAiTeaser() {
  const points = [
    { icon: LayoutTemplate, title: "A library of ready made designs", body: "Cinematic heroes, sections and full pages, all built and tested." },
    { icon: Wand2, title: "Make it yours", body: "Swap the copy, images and brand colours until it fits your business." },
    { icon: Eye, title: "Preview instantly", body: "See the real thing render live, no publishing step needed." },
    { icon: Copy, title: "Copy clean HTML and CSS", body: "Take the exact code to your own site, a client project or any platform." },
  ];

  return (
    <section id="tomora-ai" className="bg-ink py-16 text-cream md:py-24">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ---- Copy ---------------------------------------------------- */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-flame px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
              <Sparkles className="h-3.5 w-3.5" /> Tomora AI
            </span>
            <h2 className="mt-5 text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl">
              Design it here.
              <br />
              Use it anywhere.
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-cream/70">
              Start from a design that already looks expensive, make it yours, then take the code
              with you. What you see in the preview is exactly what you get.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {points.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream/10 text-flame">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-cream/55">{body}</p>
                </div>
              ))}
            </div>

            <Link
              href="/tomora-ai"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-flame px-6 py-3 text-sm font-semibold text-ink transition hover:bg-flame-600"
            >
              Explore Tomora AI <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* ---- The shipping hero, as shipped in Resources -------------- */}
          <div className="relative overflow-hidden rounded-[26px] border border-cream/10 shadow-2xl">
            <div className="relative aspect-[4/5] w-full sm:aspect-[4/3] lg:aspect-[3/4]">
              <LazyVideo
                src="https://res.cloudinary.com/dpr3gsicr/video/upload/v1784939366/0724_h5fwhf.mp4"
                poster="https://res.cloudinary.com/dpr3gsicr/video/upload/so_2/v1784939366/0724_h5fwhf.jpg"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Flat wash plus a bottom gradient, matching the original hero:
                  the copy sits low in the frame and needs the extra contrast. */}
              <span className="absolute inset-0 bg-black/30" />
              <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              {/* Mini chrome so it reads as a real page, not a stock clip. */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4 text-white">
                <span className="text-[13px] font-semibold tracking-wide">Tomora</span>
                <span className="hidden gap-4 text-[11px] text-white/80 sm:flex">
                  <span>Home</span>
                  <span>Our Story</span>
                  <span>FAQ</span>
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 text-left text-white sm:p-8">
                <h3 className="text-2xl font-semibold leading-[1.15] tracking-tight sm:text-[28px]">
                  Moving The World&apos;s
                  <br />
                  Cargo, Seamlessly
                </h3>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/80">
                  Fast, secure, and fully tracked shipping solutions, from first mile to final
                  destination.
                </p>
                <span className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black">
                  Get A Quote
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
