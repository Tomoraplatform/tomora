import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { PaymentVerifier } from "@/components/payment-verifier";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = { title: "Payment" };

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-7 shadow-lift sm:p-9">
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-accent" size={32} />
            </div>
          }
        >
          <PaymentVerifier />
        </Suspense>
      </div>
    </div>
  );
}
