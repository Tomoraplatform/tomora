import { NextResponse } from "next/server";
import { findApprovedStudent, sendMagicLinkToStudent } from "@/lib/auth";
import { UNAPPROVED_MESSAGE } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json(
        { ok: false, message: "Please enter your email address." },
        { status: 400 },
      );
    }

    const student = await findApprovedStudent(email);
    if (!student) {
      // Soft, non-revealing message.
      return NextResponse.json(
        { ok: false, approved: false, message: UNAPPROVED_MESSAGE },
        { status: 200 },
      );
    }

    await sendMagicLinkToStudent({
      email: student.email,
      full_name: student.full_name,
    });

    return NextResponse.json({ ok: true, approved: true });
  } catch (err) {
    console.error("[send-magic-link]", err);
    return NextResponse.json(
      {
        ok: false,
        message: "We couldn't send your link right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
