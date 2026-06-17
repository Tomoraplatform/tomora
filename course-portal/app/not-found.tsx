import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-8" />
      <p className="font-editorial text-5xl font-semibold text-accent-dark">404</p>
      <h1 className="mt-3 text-xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link href="/dashboard" className={buttonVariants({ size: "lg" }) + " mt-7"}>
        Go to Dashboard
      </Link>
    </div>
  );
}
