import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/login-form";
import { COURSE_PROMISE } from "@/lib/constants";

export const metadata: Metadata = { title: "Student Login" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-lift sm:p-9">
        <div className="text-center">
          <h1 className="font-editorial text-2xl font-semibold tracking-tight sm:text-3xl">
            Make Extra Income with Claude AI
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {COURSE_PROMISE}
          </p>
        </div>

        <div className="mt-7">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <p className="mt-6 max-w-md text-center text-sm text-muted">
        Not enrolled yet?{" "}
        <Link href="/checkout" className="font-semibold text-accent-dark hover:underline">
          Enroll now
        </Link>
      </p>
    </div>
  );
}
