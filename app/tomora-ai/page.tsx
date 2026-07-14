import Link from "next/link";
import { Sparkles, ArrowLeft, LayoutTemplate, Palette, Code2 } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = {
  title: "Tomora AI — Coming Soon",
  description: "Design with ready-made templates, personalise with your brand, and export clean HTML & CSS to use on any platform.",
};

export default function TomoraAiPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <MarketingNav />

      <main className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-cream">
          <Sparkles className="h-3.5 w-3.5" /> Coming soon
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Tomora AI</h1>
        <p className="mt-4 max-w-xl text-lg text-ink/70">
          A new way to design. Choose from beautiful templates, edit them with your details,
          images and brand — then copy the exact HTML &amp; CSS and use your design anywhere.
        </p>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { icon: LayoutTemplate, t: "Pick a design", d: "Browse a library of ready-made templates." },
            { icon: Palette, t: "Make it yours", d: "Your text, photos and brand colours — previewed live." },
            { icon: Code2, t: "Copy the code", d: "Clean HTML & CSS that renders exactly as designed, on any platform." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-ink/10 bg-white p-6 text-left">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink/5 text-ink">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-ink/60">{d}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-ink/50">
          We&apos;re building it now. In the meantime, you can launch a full website today.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className="rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-cream hover:opacity-90">
            Build your website free
          </Link>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/15 px-6 py-3 text-sm font-semibold text-ink hover:bg-ink/5">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
