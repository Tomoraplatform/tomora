import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { currentStudent } from "@/lib/academy/auth";
import { academyOpen } from "@/lib/academy/settings";
import { AcademyClosed } from "@/components/academy/academy-closed";
import { getCreatorByStudent, getCreatorCourse, listCreatorCourses } from "@/lib/creator/db";
import { readSalesPage } from "@/lib/creator/sales-page";
import { SalesPageEditor } from "@/components/creator/sales-page-editor";
import { APP_DOMAIN } from "@/lib/constants";

export const metadata = { robots: { index: false, follow: false }, title: "Design your sales page | Tomora" };
export const dynamic = "force-dynamic";

interface Params { params: { course: string } }

export default async function DesignSalesPage({ params }: Params) {
  if (!(await academyOpen())) return <AcademyClosed />;

  const student = await currentStudent();
  if (!student) redirect("/academy/join?next=/academy/sell");
  const creator = await getCreatorByStudent(student.id);
  if (!creator) redirect("/academy/sell");

  const course = await getCreatorCourse(params.course);
  if (!course || course.creator_id !== creator.id) notFound();

  const page = readSalesPage(course.sales_page, course);
  const all = await listCreatorCourses(creator.id);
  const linkable = all.filter((c) => c.is_active).map((c) => ({ id: c.id, title: c.title }));

  return (
    <div className="min-h-screen bg-cream">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-white px-5 py-3">
        <Link href="/academy/sell" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> My courses
        </Link>
        <p className="min-w-0 truncate text-sm font-semibold text-ink">{course.title}</p>
        {course.is_published && (
          <a href={`https://${APP_DOMAIN}/c/${creator.slug}/${course.slug}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 underline hover:text-ink">
            <ExternalLink className="h-3.5 w-3.5" /> View live
          </a>
        )}
      </div>
      <SalesPageEditor initialPage={page} creator={creator} course={course} courses={linkable} />
    </div>
  );
}
