import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { AdminLoginForm } from "@/components/admin-login-form";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-lift sm:p-9">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal text-cream">
            <ShieldCheck size={24} />
          </span>
          <h1 className="mt-4 font-editorial text-2xl font-semibold tracking-tight">
            Admin access
          </h1>
          <p className="mt-2 text-sm text-muted">
            Secure, password-free sign-in for course administrators.
          </p>
        </div>
        <div className="mt-7">
          <Suspense fallback={null}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
