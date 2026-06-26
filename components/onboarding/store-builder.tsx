"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, UploadCloud, Loader2, Check, Plus, X, Banknote,
  Package, Type, Image as ImageIcon, Rocket, Pencil, ShieldCheck,
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
import { formatNaira } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { saveProduct, type ProductInput } from "@/app/dashboard/store-actions";
import { createStoreDraft, finalizeStoreBuild } from "@/app/onboarding/actions";
import type { Product, CatalogTrustBadge } from "@/lib/database.types";

const PRESET_COLORS = ["#022245", "#0f9d76", "#c75b39", "#7c5cff", "#d4a23a", "#2563eb", "#db2777"];
const emptyProduct = (): ProductInput => ({ name: "", description: "", price: 0, images: [], category: "", stock: 0, is_active: true, isOffer: false, isNewArrival: false, offerPercent: 0, colors: [] });

const STEPS = [
  { icon: ImageIcon, label: "Product image to be displayed first" },
  { icon: Type, label: "Headline" },
  { icon: Package, label: "Products" },
  { icon: ShieldCheck, label: "Trust badges" },
  { icon: Banknote, label: "Payouts" },
  { icon: ImageIcon, label: "Promo banner" },
  { icon: Rocket, label: "Finish" },
];

export function StoreBuilderWizard({
  category, templateId, defaultEmail, onBack,
}: {
  category: CatalogCategoryId;
  templateId: string;
  defaultEmail?: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const slots = heroImageSlots(templateId);

  // Store basics + hero
  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState("#022245");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [heroCount, setHeroCount] = useState(slots);
  const [heroImgs, setHeroImgs] = useState<string[]>([]);
  const [heroBusy, setHeroBusy] = useState<number | null>(null);

  // Draft
  const [siteId, setSiteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Content
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");

  // Products
  const [products, setProducts] = useState<ProductInput[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState<ProductInput>(emptyProduct());
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [productImgBusy, setProductImgBusy] = useState(false);
  const [colorDraft, setColorDraft] = useState("");

  // Trust badges
  const defaultBadges = useMemo<CatalogTrustBadge[]>(() => (createCatalogContent(templateId, { businessName: "Store", brandColor }).trustBadges) || [], [templateId, brandColor]);
  const [badges, setBadges] = useState<CatalogTrustBadge[]>([]);
  const trustBadges = badges.length ? badges : defaultBadges;

  // Banner
  const [bannerImage, setBannerImage] = useState<string | undefined>();
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Finish
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [finishing, setFinishing] = useState(false);

  const setF = (k: keyof ProductInput, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const previewData = useMemo(() => {
    const d = createCatalogContent(templateId, { businessName: businessName || "Your Store", brandColor, logoUrl });
    if (heroImgs[0]) d.heroImage = heroImgs[0];
    if (slots > 1 && heroImgs.length > 1) d.heroImages = heroImgs.slice(1);
    if (headline.trim()) d.heroHeadline = headline.trim();
    if (subheadline.trim()) d.heroSubtext = subheadline.trim();
    if (trustBadges.length) d.trustBadges = trustBadges;
    if (bannerImage) d.sectionImages = { ...(d.sectionImages || {}), banner: bannerImage };
    d.email = defaultEmail;
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, businessName, brandColor, logoUrl, heroImgs, headline, subheadline, badges, bannerImage]);

  async function loadProducts(id: string) {
    const { data } = await createClient().from("products").select("*").eq("site_id", id).order("created_at", { ascending: false });
    setDbProducts((data as Product[]) || []);
  }

  // Create the draft store from step 0, then move on.
  async function startDraft() {
    if (!businessName.trim()) { setError("Please enter your store name."); return; }
    setError(null); setCreating(true);
    const res = await createStoreDraft({
      category, templateId, businessName, brandColor, logoUrl,
      email: defaultEmail, social: {},
    });
    setCreating(false);
    if (!res.ok || !res.siteId) { setError(res.error || "Could not create your store."); return; }
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

  async function addProduct() {
    if (!form.name.trim() || form.price <= 0) { setError("Add a product name and price."); return; }
    setError(null); setSavingProduct(true);
    const res = await saveProduct(form);
    setSavingProduct(false);
    if (!res.ok) { setError(res.error || "Could not save product."); return; }
    setProducts((p) => [...p, form]);
    if (form.category && !categories.includes(form.category)) setCategories((c) => [...c, form.category!]);
    setForm(emptyProduct());
  }

  function addCategory() {
    const c = newCat.trim();
    if (!c) return;
    if (!categories.includes(c)) setCategories((arr) => [...arr, c]);
    setF("category", c);
    setNewCat(""); setAddingCat(false);
  }

  async function goFinish() {
    setError(null);
    if (siteId) await loadProducts(siteId);
    setStep(6);
  }

  async function finish(dest: "editor" | "publish") {
    if (!siteId) return;
    setFinishing(true);
    const res = await finalizeStoreBuild({
      siteId, headline, subheadline,
      heroImage: heroImgs[0], heroImages: slots > 1 ? heroImgs.slice(1).filter(Boolean) : undefined,
      trustBadges: badges.length ? badges : undefined,
      bannerImage,
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
        <span className="text-xs text-ink/50">Step {step + 1} of {STEPS.length}</span>
      </header>

      <div className="mb-5 flex gap-1.5">
        {STEPS.map((s, i) => <div key={s.label} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-ink" : "bg-ink/15"}`} />)}
      </div>

      <div className="flex-1">
        <div className="mb-4 flex items-center gap-2 text-ink">
          {(() => { const Icon = STEPS[step].icon; return <Icon className="h-5 w-5" />; })()}
          <h1 className="text-xl font-bold">{STEPS[step].label}</h1>
        </div>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {/* 0 — Store name + hero image(s) */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">Name your store and add the product image(s) to be displayed first at the top of your store.</p>
            <Field label="Store name" required><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Bola's Beauty" /></Field>
            {slots > 1 && (
              <Field label="How many images are shown at the top?">
                <select value={heroCount} onChange={(e) => setHeroCount(Number(e.target.value))} className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                  {Array.from({ length: slots }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} image{n > 1 ? "s" : ""}</option>)}
                </select>
              </Field>
            )}
            <Field label={slots > 1 ? "Product images to be displayed first" : "Product image to be displayed first"}>
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
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Logo (optional)">
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-ink/25 text-sm text-ink/70">
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : logoUrl ? <Check className="h-4 w-4 text-emerald-600" /> : <UploadCloud className="h-4 w-4" />}
                  {logoUrl ? "Added" : "Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploadingLogo(true); const { url } = await uploadImage(f, "branding"); setUploadingLogo(false); if (url) setLogoUrl(url); }} />
                </label>
              </Field>
              <Field label="Brand color">
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => <button key={c} onClick={() => setBrandColor(c)} className={`h-7 w-7 rounded-full ${brandColor.toLowerCase() === c.toLowerCase() ? "ring-2 ring-ink ring-offset-1" : ""}`} style={{ background: c }} aria-label={c} />)}
                </div>
              </Field>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onBack} className="flex-1"><ArrowLeft className="h-4 w-4" /> Template</Button>
              <Button onClick={startDraft} disabled={creating} className="flex-1">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}</Button>
            </div>
          </div>
        )}

        {/* 1 — Headline */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">The big message at the top of your store.</p>
            <Field label="Store headline"><Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Quality skincare, delivered to your door" /></Field>
            <Field label="Sub-headline"><Textarea rows={2} value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="e.g. Shop our best-sellers at honest prices, with fast nationwide delivery." /></Field>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(2)} className="flex-1">Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* 2 — Products */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">Add your products one at a time. {products.length > 0 && <span className="font-medium text-ink">{products.length} added.</span>}</p>
            {products.length > 0 && (
              <div className="space-y-1.5">
                {products.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white p-2.5 text-sm">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded bg-cream">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-ink/30" />}
                    </div>
                    <span className="flex-1 truncate font-medium">{p.name}</span>
                    <span className="text-ink/60">{formatNaira(p.price)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 rounded-xl border border-ink/10 bg-white p-4">
              <p className="text-sm font-semibold text-ink">New product</p>
              <Field label="Name" required><Input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="Product name" /></Field>
              <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => setF("description", e.target.value)} placeholder="Short description" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (₦)" required><Input type="number" min={0} value={form.price || ""} onChange={(e) => setF("price", Number(e.target.value))} /></Field>
                <Field label="Stock"><Input type="number" min={0} value={form.stock || ""} onChange={(e) => setF("stock", Number(e.target.value))} /></Field>
              </div>
              <Field label="Category">
                {!addingCat ? (
                  <div className="flex gap-2">
                    <select value={form.category} onChange={(e) => setF("category", e.target.value)} className="h-10 flex-1 rounded-md border border-ink/15 bg-white px-3 text-sm">
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Button type="button" variant="outline" size="sm" onClick={() => setAddingCat(true)}><Plus className="h-4 w-4" /> New</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
                    <Button type="button" size="sm" onClick={addCategory}>Add</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingCat(false); setNewCat(""); }}><X className="h-4 w-4" /></Button>
                  </div>
                )}
              </Field>
              <Field label={`Images (${form.images.length}/5)`}>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((src, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => setF("images", form.images.filter((_, j) => j !== i))} className="absolute right-0 top-0 bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-ink/25 text-ink/40">
                      {productImgBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setProductImgBusy(true); const { url } = await uploadImage(f, "products"); setProductImgBusy(false); if (url) setF("images", [...form.images, url]); }} />
                    </label>
                  )}
                </div>
              </Field>
              <Field label="Available colors (optional)">
                {(form.colors || []).length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {(form.colors || []).map((c) => (
                      <span key={c} className="flex items-center gap-1 rounded-full border border-ink/15 bg-cream/60 px-3 py-1 text-sm">{c}<button type="button" onClick={() => setF("colors", (form.colors || []).filter((x) => x !== c))} className="text-ink/40"><X className="h-3 w-3" /></button></span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input value={colorDraft} onChange={(e) => setColorDraft(e.target.value)} placeholder="e.g. Black"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const c = colorDraft.trim(); if (c && !(form.colors || []).includes(c)) setF("colors", [...(form.colors || []), c]); setColorDraft(""); } }} />
                  <Button type="button" variant="outline" onClick={() => { const c = colorDraft.trim(); if (c && !(form.colors || []).includes(c)) setF("colors", [...(form.colors || []), c]); setColorDraft(""); }}>Add</Button>
                </div>
              </Field>
              <Toggle label="Show on store" checked={!!form.is_active} onChange={(v) => setF("is_active", v)} />
              <Toggle label="Special offer" checked={!!form.isOffer} onChange={(v) => setF("isOffer", v)} />
              {form.isOffer && <Field label="Discount (% off)"><Input type="number" min={0} max={100} value={form.offerPercent || ""} onChange={(e) => setF("offerPercent", Number(e.target.value))} placeholder="e.g. 20" /></Field>}
              <Toggle label="New arrival" checked={!!form.isNewArrival} onChange={(v) => setF("isNewArrival", v)} />
              <Button onClick={addProduct} disabled={savingProduct} className="w-full">{savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Add product</>}</Button>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* 3 — Trust badges */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">These reassure shoppers (delivery, secure payment, returns…). Edit them or leave them as they are.</p>
            {trustBadges.map((b, i) => (
              <div key={b.id} className="space-y-2 rounded-xl border border-ink/10 bg-white p-3">
                <Input value={b.title} onChange={(e) => setBadges(trustBadges.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Title (e.g. Free Shipping)" />
                <Input value={b.subtitle || ""} onChange={(e) => setBadges(trustBadges.map((x, j) => j === i ? { ...x, subtitle: e.target.value } : x))} placeholder="Subtitle (e.g. On orders over ₦20,000)" />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1">Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* 4 — Payouts */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">Connect the bank account where your sales should be paid out. You can skip and do this later.</p>
            <div className="rounded-xl border border-ink/10 bg-white p-4">
              <PayoutsForm initial={{ bankCode: "", bankName: "", accountNumber: "", accountName: "", connected: false }} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(5)} className="flex-1">Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* 5 — Promo banner (optional) */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">Want a promo banner on your store? Upload one and we&apos;ll add it right after your products. Or skip it.</p>
            <label className="flex aspect-[3/1] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink/25 bg-white">
              {bannerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm text-ink/50">{uploadingBanner ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-6 w-6" />} Upload banner design</span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploadingBanner(true); const { url } = await uploadImage(f, "branding"); setUploadingBanner(false); if (url) setBannerImage(url); }} />
            </label>
            {bannerImage && <button onClick={() => setBannerImage(undefined)} className="text-sm text-ink/50 hover:text-ink">Remove banner</button>}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={goFinish} className="flex-1">{bannerImage ? "Continue" : "Skip"} <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* 6 — Finish */}
        {step === 6 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">Here&apos;s your store. Open the editor to tweak any remaining section, or publish now.</p>
            <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
              <BrowserFrame>
                <div className="h-[60vh] overflow-y-auto">
                  <SiteRenderer templateId={templateId} siteData={previewData} brandColor={brandColor} products={dbProducts} />
                </div>
              </BrowserFrame>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              <Button variant="outline" onClick={() => finish("editor")} disabled={finishing}><Pencil className="h-4 w-4" /> Edit the rest</Button>
              <Button onClick={() => finish("publish")} disabled={finishing}>{finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Rocket className="h-4 w-4" /> Publish my store</>}</Button>
            </div>
            <button onClick={() => setStep(5)} className="mx-auto block text-sm text-ink/50 hover:text-ink">Back</button>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-ink/10 px-3 py-2.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
