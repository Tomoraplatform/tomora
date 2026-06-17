import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { LogOut, LayoutDashboard } from "lucide-react";

/** Header for authenticated student pages. */
export function AppHeader({
  email,
  showDashboardLink = true,
}: {
  email?: string;
  showDashboardLink?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" aria-label="Dashboard">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {showDashboardLink && (
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-accent-soft sm:inline-flex"
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          )}
          {email && (
            <span className="hidden text-sm text-muted md:inline">{email}</span>
          )}
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-accent-soft"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
