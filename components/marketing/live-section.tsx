import Link from "next/link";
import { MessageCircle, Check } from "lucide-react";
import { LIVE_COMMISSION_PERCENT } from "@/lib/live/config";

/**
 * Tomora Live on the home page.
 *
 * The pitch is aimed at the seller who never uses their website and does all
 * their business in WhatsApp already, so the section shows the chat rather
 * than describing it.
 */

const POINTS = [
  "Customers browse your products without leaving the chat",
  "They pay with a card or transfer, then come straight back",
  "Orders land in the same dashboard as your website orders",
  "Delivery updates send themselves as you fulfil each order",
];

export function LiveSection() {
  return (
    <section id="live" className="bg-ink py-20 text-cream md:py-28">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
            <MessageCircle className="h-4 w-4" /> Tomora Live
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Your shop, inside WhatsApp
          </h2>
          <p className="mt-4 text-lg text-cream/70">
            Most Nigerian customers would rather message you than visit a website. Tomora Live puts
            your products, your checkout and your order updates right inside the chat, running by
            itself while you get on with your day.
          </p>

          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <span className="text-cream/85">{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/live"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-semibold text-ink transition hover:bg-emerald-400"
            >
              <MessageCircle className="h-4 w-4" /> Activate Tomora Live
            </Link>
            <p className="text-sm text-cream/60">
              Free to switch on. Tomora takes {LIVE_COMMISSION_PERCENT}% of each WhatsApp sale, and nothing else.
            </p>
          </div>
        </div>

        {/* A mock conversation. Decorative, so it is hidden from screen readers
            rather than read out as if it were a real chat. */}
        <div aria-hidden className="mx-auto w-full max-w-sm rounded-[2rem] border-4 border-cream/15 bg-[#0b141a] p-4 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-cream/10 pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-ink">A</span>
            <div>
              <p className="text-sm font-semibold">Adebayo Fashion</p>
              <p className="text-xs text-emerald-400">online</p>
            </div>
          </div>
          <div className="space-y-2 py-4 text-sm">
            <Bubble from="them">Welcome to Adebayo Fashion 👋 What would you like to do?</Bubble>
            <Bubble from="me">Shop</Bubble>
            <Bubble from="them">
              <span className="font-semibold">Ankara Shirt</span>
              <br />₦12,000
              <br />
              <span className="text-cream/60">Tap to add to cart</span>
            </Bubble>
            <Bubble from="me">Add to cart</Bubble>
            <Bubble from="them">Added. Your cart: 1 item, ₦12,000.</Bubble>
            <Bubble from="me">Checkout</Bubble>
            <Bubble from="them">✅ Payment received. Your order is confirmed!</Bubble>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bubble({ from, children }: { from: "me" | "them"; children: React.ReactNode }) {
  const mine = from === "me";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <p
        className={`max-w-[80%] rounded-2xl px-3 py-2 leading-snug ${
          mine ? "rounded-br-sm bg-emerald-700/90 text-cream" : "rounded-bl-sm bg-cream/10 text-cream/90"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
