import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { findApprovedStudent, sendMagicLinkToStudent } from "@/lib/auth";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Admin access denied." },
      { status: 403 },
    );
  }

  try {
    const { email } = await req.json();
    const student = await findApprovedStudent(email);
    if (!student) {
      return NextResponse.json(
        { ok: false, message: "That email is not an approved student." },
        { status: 404 },
      );
    }
    await sendMagicLinkToStudent({
      email: student.email,
      full_name: student.full_name,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-magic-link]", err);
    return NextResponse.json(
      { ok: false, message: "Could not resend the link. Please try again." },
      { status: 500 },
    );
  }
}
