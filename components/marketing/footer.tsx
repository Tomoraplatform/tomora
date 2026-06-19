import Link from "next/link";
import { Twitter, Instagram, Linkedin } from "lucide-react";
import { Logo } from "@/components/logo";

export function MarketingFooter() {
  return (
    <footer className="bg-ink text-cream">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <Logo tone="cream" />
          <p className="max-w-xs text-sm text-cream/70">
            The no-code website builder for African businesses, brands and
            communities. Go live in minutes.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cream/60">
            Product
          </h4>
          <ul className="space-y-3 text-sm text-cream/80">
            <li><a href="#features" className="hover:text-cream">Features</a></li>
            <li><a href="#templates" className="hover:text-cream">Templates</a></li>
            <li><a href="#pricing" className="hover:text-cream">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cream/60">
            Company
          </h4>
          <ul className="space-y-3 text-sm text-cream/80">
            <li><Link href="/signup" className="hover:text-cream">About</Link></li>
            <li><a href="#faq" className="hover:text-cream">FAQ</a></li>
            <li><a href="mailto:tomoraplatform@gmail.com" className="hover:text-cream">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cream/60">
            Follow
          </h4>
          <div className="flex gap-3">
            {[
              { icon: Twitter, label: "Twitter" },
              { icon: Instagram, label: "Instagram" },
              { icon: Linkedin, label: "LinkedIn" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-colors hover:border-cream hover:text-cream"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-cream/15">
        <div className="container py-6 text-center text-sm text-cream/60">
          2025 Tomora. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
