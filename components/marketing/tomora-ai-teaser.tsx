import Link from "next/link";
import { Sparkles, ArrowRight, Check } from "lucide-react";

/**
 * Landing-page teaser for Tomora AI (coming soon): pick a design, edit it with
 * your brand, preview it, then copy clean HTML/CSS to use on any platform.
 * The illustration is pure CSS — a design card cycling through template looks
 * while a code window "types" the exported markup.
 */
export function TomoraAiTeaser() {
  return (
    <section id="tomora-ai" className="border-t border-ink/5 bg-ink py-16 text-cream md:py-24">
      <style>{`
        @keyframes tai-cycle {
          0%, 28% { opacity: 1; }
          33%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes tai-type {
          0% { width: 0; }
          60%, 100% { width: 100%; }
        }
        @keyframes tai-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(232,181,75,.45); }
          50% { transform: scale(1.04); box-shadow: 0 0 0 10px rgba(232,181,75,0); }
        }
        @keyframes tai-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div className="container grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8B54B] px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
            <Sparkles className="h-3.5 w-3.5" /> Coming soon
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Tomora AI</h2>
          <p className="mt-4 max-w-lg text-lg text-cream/75">
            Pick a beautiful design, make it yours with your brand, text and photos — then copy
            the exact HTML &amp; CSS and use it anywhere: your own site, a client project, or any
            other platform. What you design is exactly what you get.
          </p>
          <ul className="mt-6 space-y-3 text-cream/85">
            {[
              "A library of ready-made designs",
              "Edit with your details, images and brand colours",
              "Preview instantly — no publishing needed",
              "Copy clean HTML / CSS that works on any platform",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#E8B54B]" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/tomora-ai"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-cream px-6 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
          >
            Preview Tomora AI <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Illustration: design card cycling + code window typing */}
        <div className="relative mx-auto w-full max-w-md" style={{ animation: "tai-float 6s ease-in-out infinite" }}>
          {/* Design card with three cycling looks */}
          <div className="relative h-64 overflow-hidden rounded-2xl border border-cream/15 bg-white shadow-2xl">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 p-4"
                style={{ animation: `tai-cycle 9s linear infinite`, animationDelay: `${-i * 3}s` }}
              >
                {i === 0 && (
                  <div className="flex h-full flex-col gap-2">
                    <div className="h-16 rounded-lg bg-[#022245]" />
                    <div className="h-3 w-2/3 rounded bg-neutral-200" />
                    <div className="h-3 w-1/2 rounded bg-neutral-200" />
                    <div className="mt-auto grid grid-cols-3 gap-2">
                      <div className="h-16 rounded-lg bg-[#E8B54B]/80" />
                      <div className="h-16 rounded-lg bg-neutral-200" />
                      <div className="h-16 rounded-lg bg-neutral-300" />
                    </div>
                  </div>
                )}
                {i === 1 && (
                  <div className="flex h-full flex-col gap-2">
                    <div className="h-16 rounded-lg bg-[#1F5C3A]" />
                    <div className="grid flex-1 grid-cols-2 gap-2">
                      <div className="rounded-lg bg-neutral-200" />
                      <div className="flex flex-col gap-2">
                        <div className="h-3 w-full rounded bg-neutral-200" />
                        <div className="h-3 w-4/5 rounded bg-neutral-200" />
                        <div className="mt-auto h-8 w-24 rounded-md bg-[#1F5C3A]/80" />
                      </div>
                    </div>
                  </div>
                )}
                {i === 2 && (
                  <div className="flex h-full flex-col gap-2">
                    <div className="h-16 rounded-lg bg-[#C0703C]" />
                    <div className="grid flex-1 grid-cols-4 gap-2">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="flex flex-col gap-1.5">
                          <div className="flex-1 rounded-lg bg-neutral-200" />
                          <div className="h-2.5 rounded bg-neutral-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Code window */}
          <div className="relative -mt-10 ml-auto w-[85%] rounded-2xl border border-cream/15 bg-[#0B1B2E] p-4 shadow-2xl">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F08A7E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#E8B54B]" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-cream/40">index.html</span>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { w: "70%", c: "#7EA6F4", d: 0 },
                { w: "88%", c: "#E8B54B", d: 0.5 },
                { w: "60%", c: "#8FDBB6", d: 1.0 },
                { w: "80%", c: "#7EA6F4", d: 1.5 },
                { w: "45%", c: "#F08A7E", d: 2.0 },
              ].map((l, i) => (
                <div key={i} className="h-2.5 overflow-hidden rounded" style={{ width: l.w }}>
                  <div
                    className="h-full rounded"
                    style={{ background: l.c, opacity: 0.75, animation: `tai-type 4.5s ease-out infinite`, animationDelay: `${l.d}s` }}
                  />
                </div>
              ))}
            </div>
            <div
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#E8B54B] px-3.5 py-2 text-xs font-bold text-ink"
              style={{ animation: "tai-pulse 2.6s ease-in-out infinite" }}
            >
              Copy HTML &amp; CSS
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
