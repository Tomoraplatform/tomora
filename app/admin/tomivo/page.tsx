import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { listAllDesigns } from "@/lib/tomivo/db";
import { TomivoManager } from "@/components/admin/tomivo-manager";

export const metadata = { robots: { index: false, follow: false }, title: "AI Designs | Admin | Tomora" };
export const dynamic = "force-dynamic";

export default async function AdminTomivoPage() {
  await requireAdmin();
  const designs = await listAllDesigns();

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="text-2xl font-bold text-ink">Tomora AI Designs</h1>
        <p className="mt-1 text-ink/60">
          Add and manage gallery designs. Set each one Free or Pro, publish, and paste the preview HTML, prompt, HTML and CSS. {designs.length} design{designs.length === 1 ? "" : "s"}.
        </p>
        <div className="mt-6">
          <TomivoManager designs={designs} />
        </div>
      </div>
    </div>
  );
}
