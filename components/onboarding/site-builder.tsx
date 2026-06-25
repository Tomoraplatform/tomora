"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, UploadCloud, Loader2, Check, Store, Type, Image as ImageIcon,
  Rocket, Pencil, Heart, Banknote,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BrowserFrame } from "@/components/browser-frame";
import { SiteRenderer } from "@/components/templates";
import { PayoutsForm } from "@/components/dashboard/payouts-form";
import { createCatalogContent, heroImageSlots, type CatalogCategoryId } from "@/lib/catalog";
import { uploadImage } from "@/lib/upload";
import { createStoreDraft, finalizeStoreBuild } from "@/app/onboarding/actions";

const PRESET_COLORS = ["#022245", "#0f9d76", "#c75b39", "#7c5cff", "#d4a23a", "#2563eb", "#db2777"];

export function SiteBuilderWizard({
  category, templateId, defaultEmail, onBack,
}: {
  category: CatalogCategoryId;
  templateId: string;
  defaultEmail?: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const slots = heroImageSlots(templateId);
  const canDonate = category === "organization" || category === "events";
  // Steps: Brand, Hero, Headline, (Donations if applicable), Finish
  const steps = [
    { icon: Store, label: "Your brand" },
    { icon: ImageIcon, label: "Hero image" },
    { icon: Type, label: "Headline" },
    ...(canDonate ? [{ icon: Heart, label: "Donations" }] : []),
    { icon: Rocket, label: "Finish" },
  ];
  const finishStep = steps.length - 1;
  const donationStep = canDonate ? 3 : -1;

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Brand
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState("#022245");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [email, setEmail] = useState(defaultEmail || "");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [siteId, setSiteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Hero
  const [heroCount, setHeroCount] = useState(slots);
  const [heroImgs, setHeroImgs] = useState<string[]>([]);
  const [heroBusy, setHeroBusy] = useState<number | null>(null);

  // Content
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");

  // Donations
  const [donationOn, setDonationOn] = useState(false);
  const [donationGoal, setDonationGoal] = useState(0);

  const [finishing, setFinishing] = useState(false);

  const social = { instagram, facebook, website: whatsapp };

  const previewData = useMemo(() => {
    const d = createCatalogContent(templateId, { businessName: businessName || "Your Brand", brandColor, logoUrl, tagline });
    if (heroImgs[0]) d.heroImage = heroImgs[0];
    if (slots > 1 && heroImgs.length > 1) d.heroImages = heroImgs.slice(1);
    if (headline.trim()) d.heroHeadline = headline.trim();
    if (subheadline.trim()) d.heroSubtext = subheadline.trim();
    if (canDonate) { d.donationEnabled = donationOn; if (donationGoal) d.donationGoal = donationGoal; }
    d.email = email; d.social = social;
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, businessName, brandColor, logoUrl, tagline, heroImgs, headline, subheadline, donationOn, donationGoal, email, instagram, facebook, whatsapp]);

  async function startDraft() {
    if (!businessName.trim()) { setError("Please enter your name / organisation name."); return; }
    setError(null); setCreating(true);
    const res = await createStoreDraft({ category, templateId, businessName, tagline, brandColor, logoUrl, email, social });
    setCreating(false);
    if (!res.ok || !res.siteId) { setError(res.error || "Could not create your website."); return; }
    setSiteId(res.siteId);
    setStep(1);
  }

  async function uploadHeroAt(i: number, file?: File) {
    if (!file) return;
    setHeroBusy(i);
    const { url } = await uploadImage(file, "branding");
    setHeroBusy(null);
    if (url) setHeroImgs((arr) => { const next = [...arr]; next[i] = url; return next; });
  }

  async function finish(dest: "editor" | "publish") {
    if (!siteId) return;
    setFinishing(true);
    const res = await finalizeStoreBuild({
      siteId, headline, subheadline,
      heroImage: heroImgs[0], heroImages: slots > 1 ? heroImgs.slice(1).filter(Boolean) : undefined,
      donationEnabled: canDonate ? donationOn : undefined,
      donationGoal: canDonate && donationOn ? donationGoal : undefined,
      publish: dest === "publish",
    });
    setFinishing(false);
    if (!res.ok) { setError(res.error || "Could not save."); return; }
    router.push(dest === "editor" ? "/dashboard/editor" : "/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-cream px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <Logo />
        <span className="text-xs text-ink/50">Step {step + 1} of {steps.length}</span>
      </header>

      <div className="mb-5 flex gap-1.5">
        {steps.map((s, i) => <div key={s.label} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-ink" : "bg-ink/15"}`} />)}
      </div>

      <div className="flex-1">
        <div className="mb-4 flex items-center gap-2 text-ink">
          {(() => { const Icon = steps[step].icon; return <Icon className="h-5 w-5" />; })()}
          <h1 className="text-xl font-bold">{steps[step].label}</h1>
        </div>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {/* 0 — Brand */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">Tell us the basics. You can change all of this later.</p>
            <Field label="Name" required><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your name or organisation" /></Field>
            <Field label="Tagline"><Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A short line about you" /></Field>
            <Field label="Logo">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ink/25 py-3 text-sm text-ink/70">
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : logoUrl ? <Check className="h-4 w-4 text-emerald-600" /> : <UploadCloud className="h-4 w-4" />}
                {logoUrl ? "Logo uploaded — replace" : "Upload your logo"}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploadingLogo(true); const { url } = await uploadImage(f, "branding"); setUploadingLogo(false); if (url) setLogoUrl(url); }} />
              </label>
            </Field>
            <Field label="Brand color">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => <button key={c} onClick={() => setBrandColor(c)} className={`h-9 w-9 rounded-full ${brandColor.toLowerCase() === c.toLowerCase() ? "ring-2 ring-ink ring-offset-2" : ""}`} style={{ background: c }} aria-label={c} />)}
                <label className="relative h-9 w-9 cursor-pointer rounded-full border border-ink/20" style={{ background: brandColor }}>
                  <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
              </div>
            </Field>
            <Field label="Contact email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></Field>
            <Field label="Instagram"><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourhandle" /></Field>
            <Field label="WhatsApp / Website"><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https:// or wa.me/234..." /></Field>
            <Field label="Facebook"><Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="facebook.com/yourpage" /></Field>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onBack} className="flex-1"><ArrowLeft className="h-4 w-4" /> Template</Button>
              <Button onClick={startDraft} disabled={creating} className="flex-1">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}</Button>
            </div>
          </div>
        )}

        {/* 1 — Hero image(s) */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">Add the main photo(s) for the top of your website.</p>
            {slots > 1 && (
              <Field label="How many images does your hero show?">
                <select value={heroCount} onChange={(e) => setHeroCount(Number(e.target.value))} className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                  {Array.from({ length: slots }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} image{n > 1 ? "s" : ""}</option>)}
                </select>
              </Field>
            )}
            <div className="space-y-3">
              {Array.from({ length: slots > 1 ? heroCount : 1 }, (_, i) => (
                <label key={i} className="flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink/25 bg-white">
                  {heroImgs[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroImgs[i]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-sm text-ink/50">{heroBusy === i ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-6 w-6" />} {slots > 1 ? `Image ${i + 1}` : "Upload hero image"}</span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadHeroAt(i, e.target.files?.[0])} />
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(2)} className="flex-1">Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* 2 — Headline */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">The big message at the top of your website.</p>
            <Field label="Headline"><Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Helping communities thrive across Africa" /></Field>
            <Field label="Sub-headline"><Textarea rows={2} value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="e.g. A short sentence about what you do and who you help." /></Field>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(canDonate ? 3 : finishStep)} className="flex-1">Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* 3 — Donations (org/community only) */}
        {step === donationStep && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">Want to collect donations on your website? Turn it on, set a goal, and connect your bank. You can skip and do this later.</p>
            <div className="flex items-center justify-between rounded-lg border border-ink/10 bg-white px-3 py-2.5">
              <span className="text-sm font-medium text-ink">Enable donations</span>
              <Switch checked={donationOn} onCheckedChange={setDonationOn} />
            </div>
            {donationOn && (
              <>
                <Field label="Fundraising goal (₦)"><Input type="number" min={0} value={donationGoal || ""} onChange={(e) => setDonationGoal(Number(e.target.value))} placeholder="e.g. 2000000" /></Field>
                <div className="rounded-xl border border-ink/10 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-ink">Payout bank</p>
                  <PayoutsForm initial={{ bankCode: "", bankName: "", accountNumber: "", accountName: "", connected: false }} />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(finishStep)} className="flex-1">Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Finish */}
        {step === finishStep && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">Here&apos;s your website. Open the editor to tweak any remaining section, or publish now.</p>
            <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
              <BrowserFrame>
                <div className="h-[60vh] overflow-y-auto">
                  <SiteRenderer templateId={templateId} siteData={previewData} brandColor={brandColor} />
                </div>
              </BrowserFrame>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              <Button variant="outline" onClick={() => finish("editor")} disabled={finishing}><Pencil className="h-4 w-4" /> Edit the rest</Button>
              <Button onClick={() => finish("publish")} disabled={finishing}>{finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Rocket className="h-4 w-4" /> Publish my website</>}</Button>
            </div>
            <button onClick={() => setStep(canDonate ? 3 : 2)} className="mx-auto block text-sm text-ink/50 hover:text-ink">Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
      {children}
    </div>
  );
}
