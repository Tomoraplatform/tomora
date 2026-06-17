import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction, makeReference } from "@/lib/paystack";
import { getSettings } from "@/lib/settings";
import { normalizeEmail } from "@/lib/auth";
import { COURSE_PRICE_KOBO, COURSE_PRICE_NAIRA } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { fullName, email } = await req.json();

    if (!fullName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 },
      );
    }
    const normEmail = normalizeEmail(email);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const settings = await getSettings();
    const reference = makeReference(normEmail);
    // Fixed price: ₦9,999 = 999900 kobo.
    const amountMinor = COURSE_PRICE_KOBO;

    const init = await initializeTransaction({
      email: normEmail,
      fullName: fullName.trim(),
      amountMinor,
      currency: settings.currency,
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    });

    // Store a pending transaction record.
    const supabase = createAdminClient();
    await supabase.from("payment_transactions").insert({
      full_name: fullName.trim(),
      email: normEmail,
      provider: "paystack",
      reference,
      amount: COURSE_PRICE_NAIRA,
      currency: settings.currency,
      status: "pending",
    });

    // Also create/update a pending student record (not yet approved).
    await supabase.from("students").upsert(
      {
        email: normEmail,
        full_name: fullName.trim(),
        payment_status: "pending",
        payment_provider: "paystack",
        paystack_reference: reference,
      },
      { onConflict: "email", ignoreDuplicates: false },
    );

    return NextResponse.json({
      authorization_url: init.authorization_url,
      reference: init.reference,
    });
  } catch (err) {
    console.error("[initialize]", err);
    return NextResponse.json(
      { error: "We couldn't start the payment. Please try again." },
      { status: 500 },
    );
  }
}
