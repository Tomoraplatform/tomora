import Link from "next/link";
import { Wrench, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

/** Shown across the Academy (and creator pages) while admins have it switched off. */
export function AcademyClosed() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 py-16 text-center">
      <Logo href="/" />
      <span className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-ink/5 text-ink">
        <Wrench className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-ink sm:text-3xl">We&apos;re currently under maintenance</h1>
      <p className="mt-3 max-w-md text-ink/60">
        Tomora Academy is briefly unavailable while we make improvements. It will be available again soon.
      </p>
      <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-lg border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5">
        <ArrowLeft className="h-4 w-4" /> Back to Tomora
      </Link>
    </div>
  );
}
