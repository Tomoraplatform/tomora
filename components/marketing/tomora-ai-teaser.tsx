import Link from "next/link";
import { Sparkles, ArrowRight, Check } from "lucide-react";

/**
 * Landing-page teaser for Tomora AI (coming soon): pick a design, edit it with
 * your brand, preview it, then copy clean HTML/CSS to use on any platform.
 * The illustration is pure CSS, a looping miniature of the first Tomora AI
 * template's cinematic hero (Ken Burns zoom + clip-mask headline reveal) above
 * a code window that "types" the exported markup.
 */
export function TomoraAiTeaser() {
  return (
    <section id="tomora-ai" className="border-t border-ink/5 bg-ink py-16 text-cream md:py-24">
      <style>{`
        @keyframes tai-ken { 0% { transform: scale(1); } 100% { transform: scale(1.16); } }
        @keyframes tai-rise {
          0% { transform: translateY(115%); }
          14%, 84% { transform: translateY(0); }
          100% { transform: translateY(115%); }
        }
        @keyframes tai-fade {
          0%, 7% { opacity: 0; transform: translateY(10px); }
          22%, 84% { opacity: 1; transform: translateY(0); }
          94%, 100% { opacity: 0; transform: translateY(10px); }
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
            Pick a beautiful design, make it yours with your brand, text and photos, then copy
            the exact HTML &amp; CSS and use it anywhere: your own site, a client project, or any
            other platform. What you design is exactly what you get.
          </p>
          <ul className="mt-6 space-y-3 text-cream/85">
            {[
              "A library of ready-made designs",
              "Edit with your details, images and brand colours",
              "Preview instantly, no publishing needed",
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

        {/* Illustration: looping miniature of Template 1's cinematic hero + code window */}
        <div className="relative mx-auto w-full max-w-md" style={{ animation: "tai-float 6s ease-in-out infinite" }}>
          {/* Mini cinematic hero, mirrors the first Tomora AI template's reveal */}
          <div className="relative h-64 overflow-hidden rounded-2xl border border-cream/15 shadow-2xl">
            {/* Ken Burns warm background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(130% 110% at 30% 18%, rgba(232,181,75,.55), transparent 55%), linear-gradient(120deg, #3a2410 0%, #7a4a18 46%, #241509 100%)",
                animation: "tai-ken 14s ease-in-out infinite alternate",
              }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(30,15,2,.55), rgba(74,42,8,.15) 50%, rgba(20,10,2,.55))" }} />

            <div className="relative flex h-full flex-col p-4 text-white">
              {/* nav */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold">Aura</span>
                <span className="hidden gap-2 text-[7px] text-white/70 sm:flex"><span>How it works</span><span>·</span><span>For you</span><span>·</span><span>Pricing</span></span>
                <span className="rounded-full bg-black/70 px-2 py-1 text-[7px] font-semibold">Get Early Access</span>
              </div>

              {/* headline, clip-mask rise, staggered */}
              <div className="mt-6">
                <span className="block overflow-hidden">
                  <span className="block text-[22px] font-medium leading-none tracking-tight" style={{ animation: "tai-rise 8s cubic-bezier(.22,1,.36,1) infinite", animationDelay: ".2s" }}>Listen Closer.</span>
                </span>
                <span className="mt-1 block overflow-hidden">
                  <span className="block text-[22px] font-medium leading-none tracking-tight" style={{ animation: "tai-rise 8s cubic-bezier(.22,1,.36,1) infinite", animationDelay: ".5s" }}>Your Body Is Talking</span>
                </span>
              </div>

              {/* features, fade up */}
              <div className="mt-auto space-y-1.5">
                {[
                  { t: "Results Without The Wait", d: 0.9 },
                  { t: "Insights Made For You", d: 1.05 },
                ].map((f) => (
                  <div key={f.t} className="flex items-center gap-2" style={{ animation: "tai-fade 8s cubic-bezier(.22,1,.36,1) infinite", animationDelay: `${f.d}s` }}>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/60 text-[7px]">✓</span>
                    <span className="text-[8px] font-semibold">{f.t}</span>
                  </div>
                ))}
              </div>
            </div>
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
