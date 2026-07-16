import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { currentStudent } from "@/lib/academy/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AcademyHeader } from "@/components/academy/academy-header";
import { AcademyAuthForm } from "@/components/academy/auth-form";

export const metadata = { title: "Join — Tomora Academy" };
export const dynamic = "force-dynamic";

export default async function AcademyJoinPage({ searchParams }: { searchParams: { course?: string } }) {
  const student = await currentStudent();
  if (student && !searchParams.course) redirect("/academy/portal");

  // If they arrived from a course card, show which course they're joining for.
  let courseTitle: string | null = null;
  if (searchParams.course) {
    const admin = createAdminClient();
    const { data } = await admin.from("academy_courses").select("title").eq("id", searchParams.course).maybeSingle();
    courseTitle = data?.title || null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <AcademyHeader student={student} />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-14">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-cream">
          <GraduationCap className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
          {courseTitle ? `Get "${courseTitle}"` : "Your learning portal"}
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm text-ink/60">
          {courseTitle
            ? "Create your account (or sign in) to continue to payment — the course opens in your portal right after."
            : "Create your account or sign in to access your courses."}
        </p>
        <div className="mt-8 w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <AcademyAuthForm courseId={searchParams.course} />
        </div>
      </div>
    </div>
  );
}
