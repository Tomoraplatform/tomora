import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Check } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { TomoraAiTeaser } from "@/components/marketing/tomora-ai-teaser";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FeatureCards } from "@/components/marketing/feature-cards";
import { TemplatePreview } from "@/components/marketing/template-preview";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS, PLANS, RENEWAL_INTERVAL_MONTHS } from "@/lib/constants";
import { loadPlanDiscounts, discountedPrice } from "@/lib/discounts";
import { CATALOG_TEMPLATES, CATALOG_CATEGORIES } from "@/lib/catalog";
import { getTemplateOverrides } from "@/lib/template-overrides";
import { formatNaira } from "@/lib/utils";

const CATALOG_LABEL = Object.fromEntries(
  CATALOG_CATEGORIES.map((c) => [c.id, c.name])
) as Record<string, string>;

export default async function Home({
  searchParams,
}: {
  searchParams?: { code?: string; error?: string; error_description?: string };
}) {
  // OAuth safety net: if Supabase falls back to the Site URL (root) with an
  // auth code instead of hitting /auth/callback, forward it there to complete
  // the exchange. Handles www/apex + Site-URL-fallback edge cases.
  if (searchParams?.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(searchParams.code)}&next=/dashboard`);
  }
  if (searchParams?.error) {
    redirect(`/login?error=${encodeURIComponent(searchParams.error)}`);
  }

  const discounts = await loadPlanDiscounts();
  // Hide admin-archived/removed templates from the public showcase; apply renames.
  const templateOverrides = await getTemplateOverrides();
  const showcaseTemplates = CATALOG_TEMPLATES
    .filter((t) => !templateOverrides[t.id]?.archived && !templateOverrides[t.id]?.removed)
    .map((t) => ({ ...t, name: templateOverrides[t.id]?.displayName || t.name }));
  return (
    <div className="bg-cream text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Tomora",
              url: "https://www.tomora.com.ng",
              logo: "https://www.tomora.com.ng/icon.png",
              description: "No-code website builder for African businesses, NGOs, churches and creators. Pick a template, add your brand, and go live in minutes.",
              email: "mailto:tommyconcept4@gmail.com",
              areaServed: "NG",
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Tomora",
              url: "https://www.tomora.com.ng",
            },
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Tomora",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://www.tomora.com.ng",
              description: "Build and publish a business website with online payments, no code required.",
              offers: { "@type": "Offer", price: "0", priceCurrency: "NGN", description: "14 day free trial" },
            },
          ]),
        }}
      />
      <MarketingNav />
      <Hero />
      <HowItWorks />
      <FeatureCards />
      <TemplateShowcase templates={showcaseTemplates} />
      <TomoraAiTeaser />
      <Pricing discounts={discounts} />
      <Testimonials />
      <Faq />
      <MarketingFooter />
    </div>
  );
}

/* ----------------------------- Hero ----------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="container pt-14 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[56px]">
            Build Your Business Website in Minutes
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink/60">
            Pick a template, add your brand, and go live. Tomora is the no code website builder
            for stores, schools, churches, NGOs, and growing businesses that need a professional
            website without a developer.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-lg bg-flame text-ink hover:bg-flame-600">
              <Link href="/signup">Start Free for 14 Days</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-lg border-ink/15 bg-white">
              <a href="#templates">Browse Templates</a>
            </Button>
          </div>
        </div>
      </div>

      {/* A real Ecommerce One storefront, fully stocked, scrolling itself. */}
      <div className="container pb-16 pt-12 md:pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-ink/10 shadow-[0_30px_90px_rgba(2,34,69,0.16)]">
          <TemplatePreview
            templateId="shop-01"
            brandColor="#1F3A2E"
            businessName="OTO"
            autoScroll
            richCatalog
            className="h-[420px] md:h-[560px]"
          />
        </div>
      </div>
    </section>
  );
}

/* ----------------------- Template showcase ---------------------- */
function TemplateShowcase({ templates }: { templates: (typeof CATALOG_TEMPLATES)[number][] }) {
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

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
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
function Pricing({ discounts }: { discounts: Record<string, number> }) {
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

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="text-3xl font-bold">{formatNaira(discountedPrice(plan.price!, discounts[plan.id]))}</span>
                    {discounts[plan.id] ? (
                      <span className={`text-sm line-through ${popular ? "text-cream/50" : "text-ink/40"}`}>{formatNaira(plan.price!)}</span>
                    ) : null}
                    <span className={popular ? "text-cream/60" : "text-ink/50"}>/{plan.period}</span>
                  </div>
                )}
                {discounts[plan.id] ? (
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${popular ? "bg-cream text-ink" : "bg-emerald-100 text-emerald-700"}`}>{discounts[plan.id]}% off</span>
                ) : null}
                {plan.id === "pro" && (
                  <p className={`mt-1 text-xs ${popular ? "text-cream/60" : "text-ink/50"}`}>
                    then {formatNaira(plan.renewal!)} every {RENEWAL_INTERVAL_MONTHS} months
                  </p>
                )}
                {plan.id === "onetime" && (
                  <p className={`mt-1 text-xs ${popular ? "text-cream/60" : "text-ink/50"}`}>
                    then only {formatNaira(plan.renewal!)}/year, domain renewal &amp; maintenance
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
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
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
