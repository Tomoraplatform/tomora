import { Palette, Globe, Check, ArrowRight, UploadCloud, CreditCard } from "lucide-react";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { formatNaira } from "@/lib/utils";

/**
 * The four landing feature panels. Each is a wide rounded card with the copy
 * on one side and a realistic mock of the actual product surface on the other,
 * alternating sides down the page. Navy panels carry white mocks so the
 * illustration reads as a real screen rather than a wireframe.
 */
export function FeatureCards() {
  return (
    <section id="features" className="space-y-6 bg-white py-6 md:space-y-8 md:py-10">
      <Panel
        tone="dark"
        title={<>Brand it yours<br />in minutes</>}
        body="Set your brand color once and watch it flow through every page instantly. Upload your logo and see your site update live: no design skills, no code, no waiting on a developer."
        visual={<BrandVisual />}
      />
      <Panel
        tone="light"
        reverse
        title={<>Go live instantly on<br />your own web address</>}
        body="Publish to a free yourbrand.tomora.com.ng subdomain in one click. Ready to grow? Connect a custom domain any time and keep everything you have built."
        visual={<DomainVisual />}
      />
      <Panel
        tone="dark"
        title={<>Sell products and get paid, all from your website</>}
        body="Add products, showcase a beautiful storefront, and accept payments through Paystack, straight into your own bank account. Built for online stores that need secure checkout without the setup headache."
        visual={<CommerceVisual />}
      />
      <Panel
        tone="dark"
        reverse
        title={<>See your business<br />at a glance</>}
        body="Track orders, revenue, and website visits in real time from your Tomora dashboard, right from your phone. Know how your business is doing without logging into five different tools."
        visual={<DashboardPreview />}
      />
    </section>
  );
}

function Panel({
  tone,
  reverse = false,
  title,
  body,
  visual,
}: {
  tone: "dark" | "light";
  reverse?: boolean;
  title: React.ReactNode;
  body: string;
  visual: React.ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <div className="container">
      <div
        className={`grid grid-cols-1 items-center gap-10 rounded-[28px] p-8 sm:p-10 md:p-14 lg:grid-cols-2 lg:gap-14 ${
          dark ? "bg-slate text-white" : "bg-[#F4F3F1] text-ink"
        }`}
      >
        <div className={reverse ? "lg:order-2" : ""}>
          <h2 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p
            className={`mt-5 max-w-md text-[15px] leading-relaxed ${
              dark ? "text-white/70" : "text-ink/65"
            }`}
          >
            {body}
          </p>
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
      </div>
    </div>
  );
}

/** White surface the mocks sit on, so they read as a real screen. */
function Surface({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_18px_50px_rgba(2,34,69,0.16)] sm:p-6">
      {children}
    </div>
  );
}

function BrandVisual() {
  const swatches = ["#022245", "#c75b39", "#0f9d76", "#d4a23a", "#7c5cff"];
  return (
    <Surface>
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-ink" />
        <span className="text-sm font-medium text-ink">Brand color</span>
      </div>
      <div className="mt-4 flex gap-3">
        {swatches.map((c, i) => (
          <span
            key={c}
            className={`h-9 w-9 rounded-full ${i === 0 ? "ring-2 ring-ink ring-offset-2" : ""}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-ink/20 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-cream">
          <UploadCloud className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-medium text-ink">Upload your logo</span>
          <span className="block text-xs text-ink/50">PNG or SVG up to 2MB</span>
        </span>
      </div>
    </Surface>
  );
}

function DomainVisual() {
  return (
    <Surface>
      <div className="flex items-center gap-2 rounded-xl bg-cream px-4 py-3.5">
        <Globe className="h-4 w-4 shrink-0 text-ink" />
        <span className="truncate font-mono text-sm text-ink">yourbrand</span>
        <span className="truncate font-mono text-sm text-ink/45">.tomora.com.ng</span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <Check className="h-3 w-3" /> Live
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-ink/10 px-4 py-3.5">
        <span>
          <span className="block text-sm font-medium text-ink">Connect a custom domain</span>
          <span className="block text-xs text-ink/50">yourbrand.com</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-ink/40" />
      </div>
    </Surface>
  );
}

/**
 * Real product photography, not random placeholders: each shot actually shows
 * the item it is labelled with, so the mock reads as a genuine storefront.
 */
const SHOP_ITEMS = [
  { id: "1553062407-98eeb64c6a62", name: "Leather Backpack", price: 18000 },
  { id: "1542291026-7eec264c27ff", name: "Running Sneakers", price: 27000 },
  { id: "1524592094714-0f0654e20314", name: "Classic Watch", price: 32000 },
  { id: "1602143407151-7111542de6e8", name: "Steel Bottle", price: 6500 },
  { id: "1544816155-12df9643f363", name: "Canvas Tote", price: 9500 },
  { id: "1516035069371-29a1b244cc32", name: "Camera & Lenses", price: 41000 },
];

function CommerceVisual() {
  return (
    <Surface>
      <div className="grid grid-cols-3 gap-3">
        {SHOP_ITEMS.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-lg border border-ink/10">
            <div className="aspect-square overflow-hidden bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://images.unsplash.com/photo-${p.id}?auto=format&fit=crop&w=300&h=300&q=70`}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-0.5 p-2">
              <p className="truncate text-[11px] font-medium text-ink/80">{p.name}</p>
              <p className="text-[11px] font-semibold text-ink">{formatNaira(p.price)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-ink py-3 text-cream">
        <CreditCard className="h-4 w-4" />
        <span className="text-sm font-medium">Tomora checkout with Paystack</span>
      </div>
    </Surface>
  );
}
