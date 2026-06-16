import Link from "next/link";
import {
  Star,
  Users,
  Zap,
  Building2,
  ShoppingBag,
  User,
  Heart,
  Palette,
  Globe,
  CreditCard,
  Eye,
  Check,
  ArrowRight,
  UploadCloud,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { BrowserFrame } from "@/components/browser-frame";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TEMPLATES, FAQS, CATEGORIES } from "@/lib/constants";
import { formatNaira } from "@/lib/utils";

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.name])
) as Record<string, string>;

export default function Home() {
  return (
    <div className="bg-cream text-ink">
      <MarketingNav />
      <Hero />
      <SocialProof />
      <Features />
      <TemplateShowcase />
      <Pricing />
      <Testimonials />
      <Faq />
      <MarketingFooter />
    </div>
  );
}

/* ----------------------------- Hero ----------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-medium text-ink/70">
            <Zap className="h-3.5 w-3.5" /> Built for African businesses
          </span>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Build Your Business Website in Minutes
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink/70">
            No code. No stress. Pick a template, add your brand, and go live —
            built for African businesses.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start Free — 14 Days <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#templates">Browse Templates</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-ink/50">
            No credit card required. Live in under 5 minutes.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-ink/5 blur-2xl" />
          <BrowserFrame url="ada-styles.tomora.com">
            <HeroMockSite />
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}

function HeroMockSite() {
  return (
    <div className="text-[10px] leading-tight">
      <div className="flex items-center justify-between bg-ink px-4 py-3 text-cream">
        <span className="font-bold">Ada Styles</span>
        <div className="hidden gap-3 text-cream/80 sm:flex">
          <span>Home</span>
          <span>Shop</span>
          <span>About</span>
          <span>Contact</span>
        </div>
        <span className="rounded bg-cream px-2 py-1 text-ink">Shop Now</span>
      </div>
      <div className="bg-gradient-to-br from-ink to-ink-700 px-6 py-10 text-cream">
        <p className="text-[9px] uppercase tracking-widest text-cream/60">
          New Collection
        </p>
        <p className="mt-2 max-w-[16rem] text-xl font-bold leading-tight">
          Timeless fashion, made in Lagos
        </p>
        <span className="mt-4 inline-block rounded bg-cream px-3 py-1.5 text-ink">
          Explore
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 p-5">
        {["#e7ddcf", "#cdd9e5", "#e3d6e8"].map((c, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square rounded-md" style={{ background: c }} />
            <div className="h-1.5 w-3/4 rounded bg-slate-200" />
            <div className="h-1.5 w-1/2 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- Social proof ------------------------- */
function SocialProof() {
  const items = [
    { icon: Users, text: "Trusted by 500+ businesses across Africa" },
    { icon: Star, text: "4.9 average rating" },
    { icon: Zap, text: "Live in under 5 minutes" },
  ];
  return (
    <section className="bg-ink text-cream">
      <div className="container flex flex-col items-center justify-center gap-4 py-6 text-center text-sm sm:flex-row sm:gap-10">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-cream/80" />
            <span className="text-cream/90">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------- Features --------------------------- */
function Features() {
  const features = [
    {
      eyebrow: "Templates",
      title: "Pick a template made for your business",
      body: "Eight polished templates across business, e-commerce, creator and community categories. Choose one and you're already 90% done.",
      visual: <TemplatesVisual />,
    },
    {
      eyebrow: "Branding",
      title: "Brand it yours in minutes",
      body: "Set your brand color and it flows through the entire site instantly. Upload your logo and watch everything update live.",
      visual: <BrandVisual />,
    },
    {
      eyebrow: "Publishing",
      title: "Go live instantly",
      body: "Publish to your free yourbrand.tomora.com subdomain in one click. Upgrade any time to connect a custom domain.",
      visual: <PublishVisual />,
    },
    {
      eyebrow: "E-commerce",
      title: "Sell products and collect payments",
      body: "Add products, show a beautiful storefront, and collect payments through Paystack straight into your own bank account.",
      visual: <CommerceVisual />,
    },
  ];

  return (
    <section id="features" className="container space-y-20 py-20 md:space-y-28 md:py-28">
      {features.map((f, i) => (
        <div
          key={f.title}
          className="grid items-center gap-10 lg:grid-cols-2"
        >
          <div className={i % 2 === 1 ? "lg:order-2" : ""}>
            <span className="text-xs font-semibold uppercase tracking-widest text-ink/50">
              {f.eyebrow}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {f.title}
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/70">
              {f.body}
            </p>
          </div>
          <div className={i % 2 === 1 ? "lg:order-1" : ""}>{f.visual}</div>
        </div>
      ))}
    </section>
  );
}

function VisualCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-lg">
      {children}
    </div>
  );
}

function TemplatesVisual() {
  const cats = [
    { icon: Building2, label: "Business" },
    { icon: ShoppingBag, label: "Shop" },
    { icon: User, label: "Creator" },
    { icon: Heart, label: "Community" },
  ];
  return (
    <VisualCard>
      <div className="grid grid-cols-4 gap-3">
        {cats.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-lg border border-ink/10 bg-cream/60 p-3 text-center"
          >
            <Icon className="h-5 w-5 text-ink" />
            <span className="text-[11px] font-medium text-ink/70">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {["#022245", "#0a3263"].map((c, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-ink/10">
            <div className="h-16" style={{ background: c }} />
            <div className="space-y-1.5 p-3">
              <div className="h-2 w-2/3 rounded bg-slate-200" />
              <div className="h-2 w-1/2 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </VisualCard>
  );
}

function BrandVisual() {
  const swatches = ["#022245", "#c75b39", "#0f9d76", "#d4a23a", "#7c5cff"];
  return (
    <VisualCard>
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-ink" />
        <span className="text-sm font-medium">Brand color</span>
      </div>
      <div className="mt-4 flex gap-3">
        {swatches.map((c, i) => (
          <div
            key={c}
            className={`h-10 w-10 rounded-full ${i === 0 ? "ring-2 ring-ink ring-offset-2" : ""}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3 rounded-lg border border-dashed border-ink/20 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-ink text-cream">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Upload your logo</p>
          <p className="text-xs text-ink/50">PNG or SVG, up to 2MB</p>
        </div>
      </div>
    </VisualCard>
  );
}

function PublishVisual() {
  return (
    <VisualCard>
      <div className="flex items-center gap-2 rounded-lg bg-cream/70 px-4 py-3">
        <Globe className="h-5 w-5 text-ink" />
        <span className="font-mono text-sm text-ink/80">yourbrand</span>
        <span className="font-mono text-sm text-ink/50">.tomora.com</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          <Check className="h-3 w-3" /> Live
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Connect a custom domain</p>
          <p className="text-xs text-ink/50">yourbrand.com</p>
        </div>
        <ArrowRight className="h-4 w-4 text-ink/40" />
      </div>
    </VisualCard>
  );
}

function CommerceVisual() {
  return (
    <VisualCard>
      <div className="grid grid-cols-3 gap-3">
        {["#e7ddcf", "#cdd9e5", "#e3d6e8", "#d8e8d6", "#f0dcd2", "#dde0ec"].map(
          (c, i) => (
            <div key={i} className="space-y-1.5">
              <div className="aspect-square rounded-md" style={{ background: c }} />
              <div className="h-1.5 w-3/4 rounded bg-slate-200" />
            </div>
          )
        )}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-ink py-2.5 text-cream">
        <CreditCard className="h-4 w-4" />
        <span className="text-sm font-medium">Secure checkout with Paystack</span>
      </div>
    </VisualCard>
  );
}

/* ----------------------- Template showcase ---------------------- */
function TemplateShowcase() {
  return (
    <section id="templates" className="bg-white py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Beautiful templates for every business
          </h2>
          <p className="mt-4 text-lg text-ink/70">
            Start from a professionally designed template and make it your own.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="group relative overflow-hidden rounded-xl border border-ink/10 bg-cream/40 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className="relative flex h-40 items-center justify-center"
                style={{ background: t.thumb.bg }}
              >
                <div
                  className="h-16 w-28 rounded-md"
                  style={{ background: t.thumb.accent, opacity: 0.9 }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" asChild>
                    <Link href="/signup">
                      <Eye className="h-4 w-4" /> Preview
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-xs uppercase tracking-wide text-ink/50">
                  {CATEGORY_LABEL[t.category]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Pricing --------------------------- */
function Pricing() {
  return (
    <section id="pricing" className="container py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, honest pricing
        </h2>
        <p className="mt-4 text-lg text-ink/70">
          Start free. Upgrade when you&apos;re ready to grow.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        {/* Free trial */}
        <div className="flex flex-col rounded-2xl border border-ink/10 bg-white p-8">
          <h3 className="text-xl font-semibold">Free Trial</h3>
          <p className="mt-2 text-ink/60">Everything you need to launch.</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold">14 days</span>
            <span className="text-ink/50">free</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Subdomain included (yourbrand.tomora.com)",
              "All 8 templates",
              "Brand colors and logo",
              "No credit card required",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-ink/80">{f}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="lg" className="mt-8">
            <Link href="/signup">Start Free Trial</Link>
          </Button>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col rounded-2xl border-2 border-ink bg-ink p-8 text-cream">
          <span className="absolute right-6 top-6 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink">
            Most popular
          </span>
          <h3 className="text-xl font-semibold">Pro Plan</h3>
          <p className="mt-2 text-cream/70">For growing businesses.</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold">{formatNaira(30000)}</span>
            <span className="text-cream/60">first payment</span>
          </div>
          <p className="mt-1 text-sm text-cream/60">
            Then {formatNaira(22500)} every 4 months for 3 cycles, then resets.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "1 year custom domain included",
              "Custom domain connection",
              "E-commerce and Paystack checkout",
              "Priority support",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-cream" />
                <span className="text-cream/90">{f}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 bg-cream text-ink hover:bg-white">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Testimonials ------------------------- */
function Testimonials() {
  const quotes = [
    {
      name: "Ada Obi",
      business: "Ada Styles, Lagos",
      initials: "AO",
      quote:
        "I had my fashion store online the same afternoon. Customers pay with Paystack and the money lands in my account. Tomora just works.",
    },
    {
      name: "Tunde Bello",
      business: "Bello Consulting",
      initials: "TB",
      quote:
        "No developer, no stress. I picked a template, added my brand color, and my consulting site looked premium instantly.",
    },
    {
      name: "Grace Mwangi",
      business: "Hope Foundation, Nairobi",
      initials: "GM",
      quote:
        "We launched our donation campaigns in minutes. The progress bars and clean layout made our NGO look truly professional.",
    },
  ];
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by businesses like yours
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="flex flex-col rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"
            >
              <blockquote className="flex-1 text-ink/80">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-cream">
                  {q.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold">{q.name}</p>
                  <p className="text-xs text-ink/50">{q.business}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- FAQ ------------------------------ */
function Faq() {
  return (
    <section id="faq" className="bg-white py-20 md:py-28">
      <div className="container max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
