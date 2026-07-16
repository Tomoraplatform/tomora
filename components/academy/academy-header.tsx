import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Logo } from "@/components/logo";
import type { AcademyStudent } from "@/lib/academy/auth";
import { SignOutButton } from "./sign-out-button";

export function AcademyHeader({ student }: { student: AcademyStudent | null }) {
  return (
    <header className="border-b border-ink/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream sm:inline-flex">
            <GraduationCap className="h-3.5 w-3.5" /> Academy
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/academy" className="rounded-md px-3 py-2 text-sm font-medium text-ink/70 hover:text-ink">Courses</Link>
          {student ? (
            <>
              <Link href="/academy/portal" className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-cream hover:opacity-90">My Portal</Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/academy/join" className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-cream hover:opacity-90">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
