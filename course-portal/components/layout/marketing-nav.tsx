import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-accent-soft"
          >
            Student Login
          </Link>
          <Link href="/checkout" className={buttonVariants({ size: "sm" })}>
            Enroll Now
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-surface-warm/50">
      <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/checkout" className="hover:text-accent-dark">
            Enroll
          </Link>
          <Link href="/login" className="hover:text-accent-dark">
            Student Login
          </Link>
          <Link href="/admin/login" className="hover:text-accent-dark">
            Admin
          </Link>
        </div>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Make Extra Income with Claude AI
        </p>
      </div>
    </footer>
  );
}
