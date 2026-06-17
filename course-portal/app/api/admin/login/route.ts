import { NextResponse } from "next/server";
import { isAdminEmail, sendAdminMagicLink } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json(
        { ok: false, message: "Please enter your admin email." },
        { status: 400 },
      );
    }

    const ok = await isAdminEmail(email);
    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "This email is not authorized for admin access." },
        { status: 200 },
      );
    }

    await sendAdminMagicLink(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json(
      { ok: false, message: "Could not send the admin link. Please try again." },
      { status: 500 },
    );
  }
}
