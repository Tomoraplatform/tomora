import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * Dark, quiet, and centred on one thing.
 *
 * The auth pages step out of the marketing site's cream so the white form card
 * and the panda above it are the only things lit, which is what makes the
 * character read as the subject rather than an ornament.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink">
      {/* A soft pool of light behind the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16]"
        style={{ background: "radial-gradient(circle, #FFFFFF 0%, transparent 68%)" }}
      />
      <header className="container relative flex h-20 items-center">
        {/* Logo renders its own link; wrapping it in another nests <a> in <a>. */}
        <Logo tone="cream" />
      </header>
      <main className="container relative flex flex-1 items-center justify-center py-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="container relative py-8 text-center text-sm text-cream/45">
        <Link href="/" className="transition hover:text-cream">
          Back to Tomora home
        </Link>
      </footer>
    </div>
  );
}
