import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { Logo } from "@/components/logo";
import { listPublishedDesigns, hasActiveSubscription } from "@/lib/tomivo/db";
import { currentStudent } from "@/lib/academy/auth";
import { DesignGallery } from "@/components/tomivo/design-gallery";
import { SubscribePanel } from "@/components/tomivo/subscribe-panel";
import { SignOutBar } from "@/components/tomivo/sign-out-bar";

export const metadata = {
  title: "Design Gallery",
  description: "Preview animated landing pages, backgrounds and gradients, then copy the prompt, HTML and CSS to use on any platform. New designs every two weeks.",
};
export const dynamic = "force-dynamic";

export default async function TomivoPage({ searchParams }: { searchParams: { sub?: string } }) {
  const [designs, student] = await Promise.all([listPublishedDesigns(), currentStudent()]);
  const subscribed = student ? await hasActiveSubscription(student.id) : false;

  return (
    <div className="min-h-screen bg-[#070a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/tomora-ai" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Tomora AI
          </Link>
          <div className="flex items-center gap-4">
            <SignOutBar name={student?.name ?? null} />
            <Logo tone="cream" withWordmark={false} href="/" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-14 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Tomora AI Designs
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Stunning designs, ready to copy
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/55">
          Preview animated landing pages, backgrounds and gradients, then copy the prompt, HTML and CSS and use them on any platform.
        </p>
        <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          <Clock className="h-3.5 w-3.5" /> New designs every two weeks
        </p>

        {searchParams.sub === "active" && (
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> Subscription active. Every Pro design is unlocked.
          </div>
        )}
        {searchParams.sub === "pending" && (
          <div className="mx-auto mt-6 max-w-md rounded-lg bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
            We&apos;re confirming your payment. Pro designs unlock here within a few minutes.
          </div>
        )}
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <DesignGallery designs={designs} />
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-6 border-t border-white/10 bg-white/[0.02] px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Unlock every Pro design</h2>
            <p className="mt-3 text-white/55">Free designs are always free. Subscribe to copy the Pro ones. Cancel anytime.</p>
          </div>
          <SubscribePanel signedIn={!!student} subscribed={subscribed} />
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/35">
        © {new Date().getFullYear()} Tomora AI Designs · Preview free, subscribe to copy Pro designs.
      </footer>
    </div>
  );
}
