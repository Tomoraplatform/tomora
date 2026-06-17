import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ResendLink } from "@/components/resend-link";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = { title: "Check your email" };

export default function MagicLinkSentPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-7 text-center shadow-lift sm:p-9">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
          <MailCheck size={32} />
        </span>
        <h1 className="mt-5 font-editorial text-2xl font-semibold tracking-tight sm:text-3xl">
          Check your email
        </h1>
        <p className="mt-3 text-muted">
          We've sent your private course access link.
        </p>
        <p className="mt-2 text-sm text-muted">
          This link expires in 10 minutes. You can request a new one anytime.
        </p>

        <div className="mt-7">
          <Suspense fallback={null}>
            <ResendLink />
          </Suspense>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Wrong email?{" "}
        <Link href="/login" className="font-semibold text-accent-dark hover:underline">
          Go back to login
        </Link>
      </p>
    </div>
  );
}
