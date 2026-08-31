import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublicCreatorCourse, isCreatorEnrolled, getCreatorCourse } from "@/lib/creator/db";
import { currentStudent } from "@/lib/academy/auth";
import { academyOpen } from "@/lib/academy/settings";
import { AcademyClosed } from "@/components/academy/academy-closed";
import { CreatorCheckout } from "@/components/creator/creator-checkout";
import { splitSale } from "@/lib/creator/money";

export const metadata = { robots: { index: false, follow: false }, title: "Checkout" };
export const dynamic = "force-dynamic";

interface Params {
  params: { creator: string; course: string };
  searchParams: { course?: string };
}

export default async function CheckoutPage({ params, searchParams }: Params) {
  if (!(await academyOpen())) return <AcademyClosed />;

  const data = await getPublicCreatorCourse(params.creator, params.course);
  if (!data) notFound();
  const { creator } = data;

  // A CTA can point at a different course by this creator.
  let course = data.course;
  if (searchParams.course && searchParams.course !== course.id) {
    const other = await getCreatorCourse(searchParams.course);
    if (other && other.creator_id === creator.id && other.is_published && other.is_active) course = other;
  }

  const student = await currentStudent();
  const enrolled = student ? await isCreatorEnrolled(student.id, course.id) : false;
  const split = splitSale(course.price);

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-lg px-5 py-10">
        <Link href={`/c/${creator.slug}/${data.course.slug}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Link>
        <CreatorCheckout
          courseId={course.id}
          courseTitle={course.title}
          creatorSlug={creator.slug}
          courseSlug={course.slug}
          bannerUrl={course.banner_url}
          price={split.price}
          platformFee={split.platformFee}
          vat={split.vat}
          processingFee={split.processingFee}
          total={split.gross}
          signedIn={!!student}
          studentEmail={student?.email || ""}
          enrolled={enrolled}
        />
      </div>
    </div>
  );
}
