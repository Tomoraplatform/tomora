import Link from "next/link";
import {
  Star,
  Users,
  Zap,
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
import { TemplatePreview } from "@/components/marketing/template-preview";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS, PLANS } from "@/lib/constants";
import { CATALOG_TEMPLATES, CATALOG_CATEGORIES } from "@/lib/catalog";
import { formatNaira } from "@/lib/utils";

const CATALOG_LABEL = Object.fromEntries(
  CATALOG_CATEGORIES.map((c) => [c.id, c.name])
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
          <BrowserFrame url="ada-styles.tomora.com" bodyClassName="h-[440px]">
            <TemplatePreview templateId="shop-01" brandColor="#022245" businessName="Ada Styles" autoScroll />
          </BrowserFrame>
        </div>
      </div>
    </section>
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
  return (
    <BrowserFrame url="upskill.tomora.com" bodyClassName="h-72 sm:h-[22rem]" className="shadow-xl">
      <TemplatePreview templateId="education-01" brandColor="#2B6CB0" businessName="Upskill Academy" />
    </BrowserFrame>
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
  const items = [
    { seed: "tomshop-bag", name: "Leather Backpack", price: 18000 },
    { seed: "tomshop-shoe", name: "Running Sneakers", price: 27000 },
    { seed: "tomshop-watch", name: "Classic Watch", price: 32000 },
    { seed: "tomshop-bottle", name: "Steel Bottle", price: 6500 },
    { seed: "tomshop-bag2", name: "Canvas Tote", price: 9500 },
    { seed: "tomshop-cam", name: "Mini Camera", price: 41000 },
  ];
  return (
    <VisualCard>
      <div className="grid grid-cols-3 gap-3">
        {items.map((p) => (
          <div key={p.seed} className="overflow-hidden rounded-lg border border-ink/10">
            <div className="aspect-square overflow-hidden bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://picsum.photos/seed/${p.seed}/240`} alt={p.name} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-0.5 p-2">
              <p className="truncate text-[11px] font-medium text-ink/80">{p.name}</p>
              <p className="text-[11px] font-semibold text-ink">{formatNaira(p.price)}</p>
            </div>
          </div>
        ))}
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

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG_TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="group relative overflow-hidden rounded-xl border border-ink/10 bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-52 overflow-hidden border-b border-ink/5">
                <TemplatePreview templateId={t.id} brandColor={t.accent} businessName={t.name} />
                <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all group-hover:bg-ink/30 group-hover:opacity-100">
                  <Button size="sm" asChild>
                    <Link href="/signup">
                      <Eye className="h-4 w-4" /> Use this template
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-xs uppercase tracking-wide text-ink/50">
                  {CATALOG_LABEL[t.category]}
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
          Start free. Pick a plan when you&apos;re ready to go live.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PLANS.map((plan) => {
          const popular = plan.popular;
          const isCustom = plan.id === "custom";
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                popular ? "border-2 border-ink bg-ink text-cream" : "border-ink/10 bg-white"
              }`}
            >
              {popular && (
                <span className="absolute right-5 top-5 rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className={`mt-1 text-sm ${popular ? "text-cream/70" : "text-ink/60"}`}>{plan.tagline}</p>

              <div className="mt-5">
                {plan.id === "trial" ? (
                  <span className="text-3xl font-bold">14 days</span>
                ) : isCustom ? (
                  <span className="text-3xl font-bold">Let&apos;s talk</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatNaira(plan.price!)}</span>
                    <span className={popular ? "text-cream/60" : "text-ink/50"}>/{plan.period}</span>
                  </div>
                )}
                {plan.id === "pro" && (
                  <p className="mt-1 text-xs text-cream/60">
                    then {formatNaira(plan.renewal!)} every 4 months
                  </p>
                )}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? "text-cream" : "text-emerald-600"}`} />
                    <span className={popular ? "text-cream/90" : "text-ink/80"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant={popular ? "default" : "outline"}
                className={`mt-6 ${popular ? "bg-cream text-ink hover:bg-white" : ""}`}
              >
                {isCustom ? (
                  <a href="mailto:tomoraplatform@gmail.com">{plan.cta}</a>
                ) : (
                  <Link href="/signup">{plan.cta}</Link>
                )}
              </Button>
            </div>
          );
        })}
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
