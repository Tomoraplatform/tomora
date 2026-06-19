"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, User, GraduationCap, Heart, CalendarDays, Check, ArrowLeft, ArrowRight,
  UploadCloud, Loader2, PartyPopper, ExternalLink, Pencil,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrowserFrame } from "@/components/browser-frame";
import { SiteRenderer } from "@/components/templates";
import { TemplateThumb } from "@/components/templates/template-thumb";
import { APP_DOMAIN, TRIAL_DAYS } from "@/lib/constants";
import { CATALOG_CATEGORIES, catalogTemplatesByCategory, createCatalogContent, type CatalogCategoryId } from "@/lib/catalog";
import { slugifySubdomain } from "@/lib/utils";
import { siteLiveUrl } from "@/lib/site-url";
import { uploadImage } from "@/lib/upload";
import { completeOnboarding } from "@/app/onboarding/actions";

const ICONS = { ShoppingBag, User, GraduationCap, Heart, CalendarDays } as const;
const PRESET_COLORS = ["#022245", "#0f9d76", "#c75b39", "#7c5cff", "#d4a23a", "#2563eb", "#db2777"];

export function OnboardingWizard({ defaultEmail }: { defaultEmail?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<CatalogCategoryId | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState("#022245");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(defaultEmail || "");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  const previewData = useMemo(() => {
    if (!templateId || !category) return null;
    const d = createCatalogContent(templateId, {
      businessName: businessName || "Your Business",
      brandColor,
      logoUrl,
      tagline,
    });
    d.phone = phone; d.email = email; d.address = address;
    d.social = { instagram, twitter, facebook, website };
    return d;
  }, [templateId, category, businessName, brandColor, logoUrl, tagline, phone, email, address, instagram, twitter, facebook, website]);

  async function onLogo(file?: File) {
    if (!file) return;
    setUploading(true);
    const { url, error } = await uploadImage(file, "branding");
    setUploading(false);
    if (url) setLogoUrl(url);
    else setError(error || "Upload failed");
  }

  async function submit(destination: "editor" | "published") {
    if (!category || !templateId) return;
    setSubmitting(true);
    setError(null);
    const res = await completeOnboarding({
      category, templateId, businessName, tagline, brandColor, logoUrl,
      phone, email, address,
      social: { instagram, twitter, facebook, website },
    });
    setSubmitting(false);
    if (!res.ok) { setError(res.error || "Something went wrong."); return; }
    if (destination === "editor") { router.push("/dashboard/editor"); return; }
    setSubdomain(res.subdomain || slugifySubdomain(businessName));
    setStep(5);
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="container flex h-20 items-center justify-between">
        <Logo />
        {step < 5 && <span className="text-sm text-ink/50">Step {step} of 4</span>}
      </header>

      {step < 5 && (
        <div className="container">
          <div className="mx-auto flex max-w-2xl gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-ink" : "bg-ink/15"}`} />
            ))}
          </div>
        </div>
      )}

      <main className="container py-10">
        {/* STEP 1 — Category */}
        {step === 1 && (
          <Section title="What kind of website do you need?" subtitle="Pick the option that best fits your goals.">
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATALOG_CATEGORIES.map((c) => {
                const Icon = ICONS[c.icon];
                const active = category === c.id;
                return (
                  <button key={c.id}
                    onClick={() => { setCategory(c.id); setTemplateId(null); }}
                    className={`flex flex-col items-start gap-3 rounded-2xl border-2 bg-white p-6 text-left transition-all hover:shadow-md ${active ? "border-ink" : "border-transparent"}`}>
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink/5 text-ink"><Icon className="h-6 w-6" /></span>
                    <span className="text-lg font-semibold">{c.name}</span>
                    <span className="text-sm text-ink/60">{c.description}</span>
                  </button>
                );
              })}
            </div>
            <Nav next={() => setStep(2)} nextDisabled={!category} />
          </Section>
        )}

        {/* STEP 2 — Template */}
        {step === 2 && category && (
          <Section title="Choose your starting template" subtitle="You can fully customise it next.">
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {catalogTemplatesByCategory(category).map((t) => {
                const active = templateId === t.id;
                return (
                  <div key={t.id} className={`overflow-hidden rounded-2xl border-2 bg-white transition-all ${active ? "border-ink shadow-md" : "border-transparent"}`}>
                    <div className="border-b border-ink/5">
                      <TemplateThumb template={t} color={brandColor} />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className="mt-1 text-sm text-ink/60">{t.blurb}</p>
                      <Button className="mt-4 w-full" variant={active ? "default" : "outline"} onClick={() => setTemplateId(t.id)}>
                        {active ? (<><Check className="h-4 w-4" /> Selected</>) : "Choose This"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Nav back={() => setStep(1)} next={() => setStep(3)} nextDisabled={!templateId} />
          </Section>
        )}

        {/* STEP 3 — Brand info */}
        {step === 3 && (
          <Section title="Tell us about your brand" subtitle="Only your business name is required — the rest is optional.">
            <div className="mx-auto max-w-xl space-y-5">
              <Field label="Business name" required>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ada Styles" />
              </Field>
              <Field label="Tagline">
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Timeless fashion, made in Lagos" />
              </Field>

              <Field label="Brand color">
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setBrandColor(c)}
                      className={`h-9 w-9 rounded-full ${brandColor.toLowerCase() === c.toLowerCase() ? "ring-2 ring-ink ring-offset-2" : ""}`}
                      style={{ background: c }} aria-label={c} />
                  ))}
                  <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border border-ink/20">
                    <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="absolute -inset-2 h-14 w-14 cursor-pointer" />
                  </label>
                </div>
              </Field>

              <Field label="Logo">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink/25 p-4 hover:bg-ink/[0.02]">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="logo" className="h-12 w-12 rounded object-contain" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded bg-ink text-cream">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                    </span>
                  )}
                  <span className="text-sm text-ink/60">{logoUrl ? "Logo uploaded — click to replace" : "Upload your logo (PNG or SVG)"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
                </label>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" /></Field>
                <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@brand.com" /></Field>
              </div>
              <Field label="Address"><Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 Marina Road, Lagos" rows={2} /></Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Instagram"><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourbrand" /></Field>
                <Field label="Twitter"><Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@yourbrand" /></Field>
                <Field label="Facebook"><Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="facebook.com/yourbrand" /></Field>
                <Field label="Website"><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></Field>
              </div>
            </div>
            <Nav back={() => setStep(2)} next={() => setStep(4)} nextDisabled={!businessName.trim()} />
          </Section>
        )}

        {/* STEP 4 — Preview */}
        {step === 4 && previewData && templateId && (
          <Section title="Here's your site" subtitle="This is a live preview with your brand applied.">
            <div className="mx-auto max-w-4xl">
              <BrowserFrame url={`${slugifySubdomain(businessName) || "yourbrand"}.${APP_DOMAIN}`} bodyClassName="max-h-[60vh] overflow-y-auto">
                <div className="pointer-events-none">
                  <SiteRenderer templateId={templateId} siteData={previewData} brandColor={brandColor} />
                </div>
              </BrowserFrame>
              {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button variant="outline" size="lg" disabled={submitting} onClick={() => submit("editor")}>
                  <Pencil className="h-4 w-4" /> Edit My Site
                </Button>
                <Button size="lg" disabled={submitting} onClick={() => submit("published")}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Publish Free for {TRIAL_DAYS} Days
                </Button>
              </div>
              <button onClick={() => setStep(3)} className="mx-auto mt-4 flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
                <ArrowLeft className="h-4 w-4" /> Back to brand info
              </button>
            </div>
          </Section>
        )}

        {/* STEP 5 — Published */}
        {step === 5 && subdomain && (
          <div className="mx-auto max-w-lg py-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ink text-cream">
              <PartyPopper className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">You're live!</h1>
            <p className="mt-3 text-ink/60">Your free {TRIAL_DAYS}-day trial has started. Your site is published at:</p>
            <a
              href={siteLiveUrl({ subdomain })}
              target="_blank"
              rel="noreferrer"
              className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-5 py-4 font-mono text-sm hover:border-ink"
            >
              <span className="font-semibold text-ink">{siteLiveUrl({ subdomain }).replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="h-4 w-4 text-ink/40" />
            </a>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="outline" asChild>
                <a href={siteLiveUrl({ subdomain })} target="_blank" rel="noreferrer">View My Site</a>
              </Button>
              <Button size="lg" onClick={() => router.push("/dashboard")}>
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-ink/60">{subtitle}</p>}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

function Nav({ back, next, nextDisabled }: { back?: () => void; next: () => void; nextDisabled?: boolean }) {
  return (
    <div className="mx-auto mt-10 flex max-w-3xl items-center justify-between">
      {back ? (
        <Button variant="ghost" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</Button>
      ) : <span />}
      <Button onClick={next} disabled={nextDisabled}>Continue <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}
