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
          {/* Design card cycling three real miniature SaaS designs */}
          <div className="relative h-64 overflow-hidden rounded-2xl border border-cream/15 bg-white shadow-2xl">
            {/* Look 1 — SaaS landing page hero */}
            <div className="absolute inset-0" style={{ animation: "tai-cycle 9s linear infinite", animationDelay: "0s" }}>
              <div className="flex h-full flex-col bg-[#0B1020] p-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[9px] font-bold"><span className="h-2.5 w-2.5 rounded-full bg-[#6366F1]" />PulseHQ</span>
                  <span className="flex gap-2 text-[7px] text-white/60"><span>Product</span><span>Pricing</span><span>Docs</span></span>
                  <span className="rounded-md bg-[#6366F1] px-2 py-1 text-[7px] font-semibold">Sign up</span>
                </div>
                <div className="mt-4 flex flex-1 gap-3">
                  <div className="flex-1">
                    <span className="rounded-full bg-[#6366F1]/20 px-1.5 py-0.5 text-[6px] font-semibold text-[#A5B4FC]">NEW · AI reports</span>
                    <p className="mt-1.5 text-[13px] font-extrabold leading-tight">Know your metrics<br />before they move</p>
                    <p className="mt-1 text-[7px] leading-snug text-white/55">Realtime analytics for growing SaaS teams.<br />Set up in minutes, no code required.</p>
                    <div className="mt-2 flex gap-1.5">
                      <span className="rounded-md bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-2 py-1 text-[7px] font-bold">Start free trial</span>
                      <span className="rounded-md border border-white/25 px-2 py-1 text-[7px] font-semibold text-white/80">Live demo</span>
                    </div>
                    <p className="mt-2 text-[6px] text-white/40">Trusted by 2,400+ teams · No card needed</p>
                  </div>
                  <div className="w-[45%] self-center rounded-lg bg-white p-2 shadow-xl">
                    <p className="text-[6px] font-semibold text-neutral-500">Monthly revenue</p>
                    <p className="text-[11px] font-extrabold text-neutral-900">$48,290 <span className="text-[6px] font-bold text-emerald-500">▲ 12%</span></p>
                    <div className="mt-1.5 flex h-10 items-end gap-[3px]">
                      {[35, 55, 40, 70, 58, 85, 100].map((h, j) => (
                        <span key={j} className="flex-1 rounded-sm bg-gradient-to-t from-[#6366F1] to-[#A5B4FC]" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Look 2 — SaaS features section */}
            <div className="absolute inset-0" style={{ animation: "tai-cycle 9s linear infinite", animationDelay: "-3s" }}>
              <div className="flex h-full flex-col bg-[#FAFAF7] p-4 text-neutral-900">
                <p className="text-center text-[6px] font-bold uppercase tracking-wider text-[#0D9488]">Why teams choose Nimbus</p>
                <p className="mt-0.5 text-center text-[13px] font-extrabold leading-tight">Everything your team needs<br />to ship faster</p>
                <div className="mt-3 grid flex-1 grid-cols-3 gap-2">
                  {[
                    { c: "#0D9488", t: "Automations", d: "Put busywork on autopilot with rules." },
                    { c: "#F59E0B", t: "Insights", d: "Dashboards your whole team understands." },
                    { c: "#6366F1", t: "Integrations", d: "Connects to 80+ tools out of the box." },
                  ].map((f) => (
                    <div key={f.t} className="rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
                      <span className="flex h-4 w-4 items-center justify-center rounded-md text-[7px] font-bold text-white" style={{ background: f.c }}>✓</span>
                      <p className="mt-1 text-[8px] font-bold">{f.t}</p>
                      <p className="mt-0.5 text-[6px] leading-snug text-neutral-500">{f.d}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className="rounded-md bg-neutral-900 px-2.5 py-1 text-[7px] font-bold text-white">Get started — it&apos;s free</span>
                  <span className="text-[6px] text-neutral-400">14-day trial · Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Look 3 — SaaS analytics dashboard */}
            <div className="absolute inset-0" style={{ animation: "tai-cycle 9s linear infinite", animationDelay: "-6s" }}>
              <div className="flex h-full bg-[#F4F5F7] text-neutral-900">
                <div className="flex w-14 flex-col gap-1.5 bg-[#111827] p-2 text-[6px] font-semibold text-white/70">
                  <span className="mb-1 flex items-center gap-1 text-[7px] font-bold text-white"><span className="h-2 w-2 rounded-sm bg-[#22D3EE]" />Statly</span>
                  <span className="rounded bg-white/15 px-1.5 py-1 text-white">Overview</span>
                  <span className="px-1.5 py-1">Reports</span>
                  <span className="px-1.5 py-1">Customers</span>
                  <span className="px-1.5 py-1">Billing</span>
                  <span className="px-1.5 py-1">Settings</span>
                </div>
                <div className="flex-1 p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-bold">Good morning, Ada</p>
                    <span className="rounded-md bg-[#111827] px-1.5 py-0.5 text-[6px] font-semibold text-white">Export</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {[
                      { l: "MRR", v: "$12.4k", d: "+8.2%" },
                      { l: "Active users", v: "3,207", d: "+4.1%" },
                      { l: "Retention", v: "98.2%", d: "+0.6%" },
                    ].map((s) => (
                      <div key={s.l} className="rounded-lg bg-white p-1.5 shadow-sm">
                        <p className="text-[6px] text-neutral-500">{s.l}</p>
                        <p className="text-[9px] font-extrabold">{s.v}</p>
                        <p className="text-[6px] font-bold text-emerald-500">{s.d}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 rounded-lg bg-white p-1.5 shadow-sm">
                    <p className="text-[6px] font-semibold text-neutral-500">Signups this week</p>
                    <svg viewBox="0 0 200 40" className="mt-0.5 h-10 w-full">
                      <polygon points="0,40 0,30 25,26 50,28 75,18 100,22 125,12 150,14 175,6 200,10 200,40" fill="#22D3EE" opacity="0.15" />
                      <polyline points="0,30 25,26 50,28 75,18 100,22 125,12 150,14 175,6 200,10" fill="none" stroke="#0891B2" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
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
