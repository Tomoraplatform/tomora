import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";
import { sendMagicLinkToStudent } from "@/lib/auth";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/auth";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Admin access denied." },
      { status: 403 },
    );
  }

  try {
    const { fullName, email, sendLink } = await req.json();
    if (!fullName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { ok: false, message: "Full name and email are required." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const normEmail = normalizeEmail(email);

    const { error } = await supabase.from("students").upsert(
      {
        email: normEmail,
        full_name: fullName.trim(),
        approved_status: true,
        payment_status: "manual",
        payment_provider: "manual",
      },
      { onConflict: "email" },
    );
    if (error) throw new Error(error.message);

    if (sendLink) {
      const w = welcomeEmail(fullName.trim());
      await sendEmail({ to: normEmail, subject: w.subject, html: w.html });
      await sendMagicLinkToStudent({ email: normEmail, full_name: fullName.trim() });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[add-student]", err);
    return NextResponse.json(
      { ok: false, message: "Could not add student. Please try again." },
      { status: 500 },
    );
  }
}
