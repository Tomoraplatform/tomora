/**
 * "From idea to live website in three steps": a hand-drawn style path that
 * rises across the section with a node at each step. The copy sits beside its
 * own node, so the eye follows the curve upward from picking a template to
 * going live.
 *
 * The path is one SVG that scales with the viewport; on small screens it is
 * swapped for a simple vertical rail, since a wide curve is unreadable there.
 */
/** Node and copy anchors, as percentages of the 1000x420 path box. */
const STEP_POINTS = [
  { left: "15%", node: "47.6%", copyLeft: "7%", copy: "54%" },
  { left: "50%", node: "26.2%", copyLeft: "43%", copy: "32%" },
  { left: "80%", node: "10.7%", copyLeft: "73%", copy: "17%" },
];

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

        {/* ---- Desktop: the curved path ----------------------------------
            The SVG box carries spare height below the curve so the nodes and
            the copy can both be placed as percentages of the same coordinate
            space. That keeps every node sitting on the line at any width. */}
        <div className="relative mt-12 hidden md:block">
          <svg
            viewBox="0 0 1000 420"
            fill="none"
            className="w-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 210 C 60 210, 90 200, 150 200 C 260 200, 300 110, 500 110 C 650 110, 680 45, 800 45 C 900 45, 950 60, 1000 72"
              stroke="#EE8B3D"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Node y values are the path's anchor points over the 420 box:
              200 -> 47.6%, 110 -> 26.2%, 45 -> 10.7%. */}
          {STEP_POINTS.map((pos, i) => (
            <span
              key={i}
              className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(2,34,69,0.14)]"
              style={{ left: pos.left, top: pos.node }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#C9CBD0]" />
            </span>
          ))}

          {steps.map((s, i) => (
            <div
              key={s.title}
              className="absolute w-[16rem]"
              style={{ left: STEP_POINTS[i].copyLeft, top: STEP_POINTS[i].copy }}
            >
              <h3 className="text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{s.body}</p>
            </div>
          ))}
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
