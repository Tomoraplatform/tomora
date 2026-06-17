import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { CheckoutForm } from "@/components/checkout-form";
import { formatNaira } from "@/lib/utils";
import {
  COURSE_PROMISE,
  COURSE_PRICE_NAIRA,
  COURSE_ORIGINAL_PRICE_NAIRA,
} from "@/lib/constants";
import { Check, PlayCircle, FileText, Bot, MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: "Checkout" };

const learnerGets = [
  { icon: PlayCircle, text: "Start Here orientation + 5 focused modules" },
  { icon: FileText, text: "View-only worksheets for every module" },
  { icon: Bot, text: "Practical Claude AI workflows" },
  { icon: MessageCircle, text: "Access to the WhatsApp community" },
];

export default function CheckoutPage() {
  const price = formatNaira(COURSE_PRICE_NAIRA);
  const originalPrice = formatNaira(COURSE_ORIGINAL_PRICE_NAIRA);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="mx-auto grid w-full max-w-content flex-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-16">
        {/* Summary */}
        <div>
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-dark">
            Enroll
          </span>
          <h1 className="mt-3 font-editorial text-3xl font-semibold tracking-tight sm:text-4xl">
            Make Extra Income with Claude AI
          </h1>
          <p className="mt-3 max-w-md text-lg leading-relaxed text-muted">
            {COURSE_PROMISE}
          </p>

          <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-card">
            <p className="text-sm font-semibold text-charcoal">What you get</p>
            <ul className="mt-4 space-y-3">
              {learnerGets.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
                    <Icon size={18} />
                  </span>
                  <span className="text-[15px]">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
              <span className="text-sm text-muted">One-time payment</span>
              <span className="flex items-baseline gap-2.5">
                <span className="text-2xl font-bold text-charcoal">{price}</span>
                <span className="text-base text-muted line-through">
                  {originalPrice}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:pt-4">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-lift sm:p-8">
            <h2 className="text-xl font-bold tracking-tight">Your details</h2>
            <p className="mt-1 text-sm text-muted">
              Enter your name and the email you want to use for access.
            </p>
            <div className="mt-6">
              <CheckoutForm priceLabel={price} />
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-muted">
            Already paid?{" "}
            <Link href="/login" className="font-semibold text-accent-dark hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
