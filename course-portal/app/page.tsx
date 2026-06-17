import Link from "next/link";
import {
  MarketingNav,
  MarketingFooter,
} from "@/components/layout/marketing-nav";
import { buttonVariants } from "@/components/ui/button";
import { HeroBanner } from "@/components/hero-banner";
import { formatNaira } from "@/lib/utils";
import {
  COURSE_PRICE_NAIRA,
  COURSE_ORIGINAL_PRICE_NAIRA,
} from "@/lib/constants";
import {
  Sparkles,
  Compass,
  Layers,
  Bot,
  Wallet,
  Rocket,
  Check,
  PlayCircle,
  FileText,
  ShieldCheck,
} from "lucide-react";

const modules = [
  { icon: Compass, title: "Set Your Foundation", desc: "Understand the opportunity and design your brand presence blueprint." },
  { icon: Layers, title: "Build Your Online Presence", desc: "Create a clean brand structure and set up your digital home." },
  { icon: Bot, title: "Use Claude AI to Create Faster", desc: "Think with Claude and produce content and brand assets in minutes." },
  { icon: Wallet, title: "Monetize Your Presence", desc: "Turn your skill or knowledge into a simple, sellable offer." },
  { icon: Rocket, title: "Launch and Improve", desc: "Share your brand online and grow with feedback and consistency." },
];

const includes = [
  { icon: PlayCircle, text: "5 focused modules + a Start Here orientation" },
  { icon: FileText, text: "View-only worksheets you complete as you go" },
  { icon: Bot, text: "Practical Claude AI workflows for real output" },
  { icon: ShieldCheck, text: "Private access — only for enrolled students" },
];

export default function HomePage() {
  const price = formatNaira(COURSE_PRICE_NAIRA);
  const originalPrice = formatNaira(COURSE_ORIGINAL_PRICE_NAIRA);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-soft/60 blur-3xl" />
          <div className="mx-auto grid max-w-content items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft/60 px-3.5 py-1.5 text-xs font-semibold text-accent-dark">
                <Sparkles size={14} /> A premium mini-course
              </span>
              <h1 className="mt-5 font-editorial text-4xl font-semibold leading-[1.08] tracking-tight text-charcoal sm:text-5xl lg:text-[3.4rem]">
                Make Extra Income with Claude AI
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                Create a clean online presence for your brand and learn how to
                monetize it — a calm, step-by-step path for anyone ready to
                build something of their own.
              </p>
              <div className="mt-7 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-charcoal">{price}</span>
                <span className="text-lg text-muted line-through">
                  {originalPrice}
                </span>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-dark">
                  Limited-time price
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/checkout"
                  className={buttonVariants({ size: "lg" })}
                >
                  Enroll Now — {price}
                </Link>
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  I'm already enrolled
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted">
                Private access · Magic-link login · No passwords to remember
              </p>
            </div>

            {/* Hero card */}
            <div className="animate-fade-up rounded-3xl border border-line bg-surface p-6 shadow-lift sm:p-8">
              {/* Banner */}
              <HeroBanner />
              {/* Course outline */}
              <div className="mt-7 space-y-3">
                {includes.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
                      <Icon size={18} />
                    </span>
                    <span className="text-[15px] text-charcoal">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="border-y border-line bg-surface-warm/40">
          <div className="mx-auto max-w-content px-4 py-12 text-center sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-dark">
              Who it's for
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-xl leading-relaxed text-charcoal">
              Anybody looking to make extra income or build a personal online
              presence for their brand — beginners welcome.
            </p>
          </div>
        </section>

        {/* Modules */}
        <section className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="font-editorial text-3xl font-semibold tracking-tight sm:text-4xl">
              What you'll move through
            </h2>
            <p className="mt-3 text-muted">
              Five modules, each with one short video lesson and a practical
              worksheet you complete inside the portal.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="group rounded-2xl border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                    <Icon size={22} />
                  </span>
                  <span className="text-sm font-semibold text-muted">
                    Module {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
            <div className="flex flex-col justify-center rounded-2xl border border-dashed border-accent/30 bg-accent-soft/30 p-6">
              <h3 className="text-lg font-bold tracking-tight text-accent-dark">
                + Start Here
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                A short orientation lesson so you know exactly how to get the
                most from the course.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="mx-auto max-w-content px-4 pb-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-line bg-charcoal px-6 py-12 text-center sm:px-12">
            <h2 className="font-editorial text-3xl font-semibold text-cream sm:text-4xl">
              Ready to build and monetize your presence?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-cream/70">
              One payment. Lifetime private access. Learn at your own pace.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-cream">{price}</span>
                <span className="text-xl text-cream/50 line-through">
                  {originalPrice}
                </span>
              </div>
              <Link
                href="/checkout"
                className={buttonVariants({ size: "lg" }) + " mt-1"}
              >
                Enroll Now
              </Link>
              <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-cream/70">
                <li className="flex items-center gap-1.5"><Check size={15} /> Secure Paystack checkout</li>
                <li className="flex items-center gap-1.5"><Check size={15} /> Instant access link</li>
                <li className="flex items-center gap-1.5"><Check size={15} /> WhatsApp community</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
