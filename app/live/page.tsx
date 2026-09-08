import Link from "next/link";
import { MessageCircle, Check } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { LIVE_COMMISSION_PERCENT } from "@/lib/live/config";

export const metadata = {
  title: "Tomora Live is coming soon",
  description:
    "Tomora Live puts your products, your checkout and your order updates inside WhatsApp. Launching soon.",
};

/**
 * Public landing for Tomora Live while it is being connected to WhatsApp.
 *
 * The marketing CTA used to point at /dashboard/live, which sends a logged-out
 * visitor to a login screen for a feature they cannot use yet. This says where
 * things actually stand instead.
 */
const POINTS = [
  "Customers browse your products without leaving the chat",
  "They pay with a card or transfer, then come straight back",
  "Orders land in the same dashboard as your website orders",
  "Delivery updates send themselves as you fulfil each order",
];

export default function LiveComingSoonPage() {
  return (
    <>
      <MarketingNav />
      <main className="bg-ink text-cream">
        <section className="container flex flex-col items-center py-24 text-center md:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">
            <MessageCircle className="h-4 w-4" /> Tomora Live
          </span>

          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Your shop, inside WhatsApp
          </h1>

          <p className="mt-3 text-xl font-semibold text-emerald-300">Coming soon</p>

          <p className="mt-6 max-w-2xl text-lg text-cream/75">
            Most Nigerian customers would rather message you than visit a website.
            Tomora Live puts your products, your checkout and your order updates
            right inside the chat, running by itself while you get on with your day.
            We are finishing the WhatsApp connection now.
          </p>

          <ul className="mt-10 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <span className="text-cream/85">{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-col items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 font-semibold text-ink transition hover:bg-emerald-400"
            >
              Build your website first
            </Link>
            <p className="max-w-md text-sm text-cream/60">
              Live will switch on for your existing store, so everything you build
              now carries straight over. Free to activate, and Tomora takes{" "}
              {LIVE_COMMISSION_PERCENT}% of each WhatsApp sale, nothing else.
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
