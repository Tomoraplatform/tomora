/**
 * "From idea to live website in three steps": a hand-drawn style path that
 * rises across the section with a node at each step. The copy sits beside its
 * own node, so the eye follows the curve upward from picking a template to
 * going live.
 *
 * The path is one SVG that scales with the viewport; on small screens it is
 * swapped for a simple vertical rail, since a wide curve is unreadable there.
 */
export function HowItWorks() {
  const steps = [
    {
      title: "Pick a template",
      body: "Choose from professionally designed templates built for e-commerce, education, NGOs, events, portfolios and more.",
    },
    {
      title: "Add your brand",
      body: "Drop in your logo, brand color, and content. Your whole site updates instantly.",
    },
    {
      title: "Go Live",
      body: "Publish free to your Tomora subdomain, or connect your own custom domain.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#F4F3F1] py-16 md:py-24">
      <div className="container">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-flame">
          How it works
        </span>
        <h2 className="mt-4 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          From idea to live
          <br />
          website in three steps
        </h2>

        {/* ---- Desktop: the curved path ---------------------------------- */}
        <div className="relative mt-14 hidden md:block">
          <svg
            viewBox="0 0 1000 260"
            fill="none"
            className="w-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 214 C 130 214, 150 118, 270 118 C 390 118, 400 40, 520 40 C 640 40, 660 92, 780 92 C 880 92, 930 118, 1000 128"
              stroke="#EE8B3D"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Nodes sit at the path's step points, as percentages of the box. */}
          {[
            { left: "10.5%", top: "82%" },
            { left: "38%", top: "45%" },
            { left: "72%", top: "35%" },
          ].map((pos, i) => (
            <span
              key={i}
              className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(2,34,69,0.14)]"
              style={{ left: pos.left, top: pos.top }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#C9CBD0]" />
            </span>
          ))}

          {/* Copy blocks, each anchored under or over its own node. */}
          <div className="relative mt-4 grid grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className={
                  i === 0
                    ? "col-start-1"
                    : i === 1
                      ? "col-start-2 -mt-24"
                      : "col-start-3 -mt-44"
                }
              >
                <h3 className="text-base font-bold">{s.title}</h3>
                <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-ink/60">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Mobile: a vertical rail ----------------------------------- */}
        <ol className="relative mt-10 space-y-8 border-l-2 border-flame/40 pl-7 md:hidden">
          {steps.map((s) => (
            <li key={s.title} className="relative">
              <span className="absolute -left-[38px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(2,34,69,0.14)]">
                <span className="h-2 w-2 rounded-full bg-flame" />
              </span>
              <h3 className="text-base font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
