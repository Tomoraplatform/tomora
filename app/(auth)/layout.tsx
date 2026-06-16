import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="container flex h-20 items-center">
        <Logo />
      </header>
      <main className="container flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="container py-8 text-center text-sm text-ink/50">
        <Link href="/" className="hover:text-ink">
          Back to Tomora home
        </Link>
      </footer>
    </div>
  );
}
