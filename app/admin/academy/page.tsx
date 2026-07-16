import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { listCourses, getCourseWithContent } from "@/lib/academy/db";
import { AcademyManager } from "@/components/admin/academy-manager";

export const metadata = { title: "Academy — Admin — Tomora" };
export const dynamic = "force-dynamic";

export default async function AdminAcademyPage() {
  await requireAdmin();
  const courses = await listCourses();
  const detailed = await Promise.all(courses.map((c) => getCourseWithContent(c.id)));

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="text-2xl font-bold text-ink">Academy</h1>
        <p className="mt-1 text-ink/60">Create and manage courses, modules and lessons. Manage student access below each course.</p>
        <div className="mt-6">
          <AcademyManager courses={detailed.filter(Boolean) as NonNullable<(typeof detailed)[number]>[]} />
        </div>
      </div>
    </div>
  );
}
