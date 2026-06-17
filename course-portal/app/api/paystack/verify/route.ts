import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import { enrollPaidStudent } from "@/lib/enrollment";
import { fromMinorUnits } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();
    if (!reference) {
      return NextResponse.json(
        { status: "error", message: "Missing payment reference." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // The pending record we created at initialize time (source of truth for expected values).
    const { data: pending } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    const data = await verifyTransaction(reference);

    if (data.status !== "success") {
      if (pending) {
        await supabase
          .from("payment_transactions")
          .update({ status: "failed", raw_response: data })
          .eq("reference", reference);
      }
      return NextResponse.json(
        { status: "failed", message: "Payment was not successful." },
        { status: 200 },
      );
    }

    // Confirm amount + email match what we expected.
    const paidMajor = fromMinorUnits(data.amount);
    const expectedEmail =
      pending?.email || data.metadata?.email || data.customer.email;
    const emailMatches =
      data.customer.email.toLowerCase() === expectedEmail.toLowerCase();
    const amountMatches = !pending || Number(pending.amount) <= paidMajor;

    if (!emailMatches || !amountMatches) {
      return NextResponse.json(
        {
          status: "mismatch",
          message:
            "Payment details did not match our records. Please contact support.",
        },
        { status: 200 },
      );
    }

    const fullName =
      pending?.full_name || data.metadata?.full_name || expectedEmail.split("@")[0];

    await enrollPaidStudent({
      email: data.customer.email,
      fullName,
      reference,
      provider: "paystack",
      customerCode: data.customer.customer_code,
      amount: paidMajor,
      currency: data.currency,
      rawResponse: data,
    });

    return NextResponse.json({
      status: "success",
      message:
        "Payment confirmed. Your private course access link has been sent to your email.",
      email: data.customer.email,
    });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json(
      {
        status: "error",
        message:
          "We could not verify this payment yet. Please contact support or try again.",
      },
      { status: 500 },
    );
  }
}
