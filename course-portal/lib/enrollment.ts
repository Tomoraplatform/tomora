import { createAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkToStudent } from "@/lib/auth";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/auth";

interface EnrollArgs {
  email: string;
  fullName: string;
  reference: string;
  provider?: string;
  customerCode?: string | null;
  amount?: number; // major units
  currency?: string;
  rawResponse?: unknown;
}

/**
 * Idempotently approves a student after a successful payment, records the
 * transaction as success, sends the welcome + magic-link emails. Safe to call
 * from both /verify and /webhook — if the student is already approved for this
 * reference, it does not re-send.
 */
export async function enrollPaidStudent(args: EnrollArgs) {
  const supabase = createAdminClient();
  const email = normalizeEmail(args.email);
  const fullName = args.fullName?.trim() || email.split("@")[0];

  // Has this exact payment already been fully processed?
  const { data: existing } = await supabase
    .from("students")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  const alreadyEnrolledForRef =
    existing?.approved_status === true &&
    existing?.paystack_reference === args.reference;

  // Upsert the student record as approved + paid.
  const { data: student, error: upsertErr } = await supabase
    .from("students")
    .upsert(
      {
        email,
        full_name: fullName,
        approved_status: true,
        payment_status: "paid",
        payment_provider: args.provider || "paystack",
        paystack_customer_code: args.customerCode ?? existing?.paystack_customer_code ?? null,
        paystack_reference: args.reference,
      },
      { onConflict: "email" },
    )
    .select()
    .single();

  if (upsertErr) throw new Error(upsertErr.message);

  // Mark the matching transaction as success.
  await supabase
    .from("payment_transactions")
    .update({
      status: "success",
      student_id: student!.id,
      raw_response: args.rawResponse ?? null,
      ...(args.amount != null ? { amount: args.amount } : {}),
      ...(args.currency ? { currency: args.currency } : {}),
    })
    .eq("reference", args.reference);

  if (alreadyEnrolledForRef) {
    return { student: student!, emailed: false };
  }

  // First time we're approving this enrollment -> send emails.
  const w = welcomeEmail(fullName);
  await sendEmail({ to: email, subject: w.subject, html: w.html });
  await sendMagicLinkToStudent({ email, full_name: fullName });

  return { student: student!, emailed: true };
}
