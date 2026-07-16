import { NextResponse, type NextRequest } from "next/server";
import { settleAcademyPayment } from "@/lib/academy/enroll";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Paystack redirects buyers here after paying for a course. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") || request.nextUrl.searchParams.get("trxref") || "";
  const portal = new URL("/academy/portal", request.nextUrl.origin);

  const result = await settleAcademyPayment(reference);
  if (result.ok && result.courseId) {
    // Land the student straight in the course they just bought.
    const admin = createAdminClient();
    const { data: course } = await admin.from("academy_courses").select("slug").eq("id", result.courseId).maybeSingle();
    if (course?.slug) return NextResponse.redirect(new URL(`/academy/learn/${course.slug}?welcome=1`, request.nextUrl.origin));
  }
  portal.searchParams.set("status", result.ok ? "success" : "pending");
  return NextResponse.redirect(portal);
}
