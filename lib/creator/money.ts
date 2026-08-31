import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { VAT_PERCENT, PAYSTACK_FEE_PERCENT } from "@/lib/constants";

/** Tomora's cut of every creator course sale, added on top of the price. */
export const CREATOR_PLATFORM_FEE_PERCENT = 3;
/** Minimum withdrawal from any Tomora wallet. */
export const MIN_WITHDRAWAL = 5000;

export interface SaleSplit {
  /** Course price before VAT. */
  price: number;
  /** VAT added on top, charged to the student. */
  vat: number;
  /** Paystack's processing fee, also charged to the student. */
  processingFee: number;
  /** What the student actually pays (price + fee + VAT + processing fee). */
  gross: number;
  /** Tomora's 3%, added on top of the price rather than taken out of it. */
  platformFee: number;
  /** What the creator receives into their wallet. */
  creatorShare: number;
}

/**
 * Splits a creator course sale.
 *
 * The student covers everything on top of the price: Tomora's 3%, VAT, and
 * Paystack's processing fee. The creator receives the price they set, whole.
 * That is the point of adding the fee rather than deducting it, a creator who
 * lists a course at ₦10,000 is paid ₦10,000.
 *
 * Example, ₦10,000 course: student pays ₦11,350
 * (₦10,000 + ₦300 fee + ₦750 VAT + ₦300 processing),
 * Tomora keeps ₦300, the creator receives ₦10,000.
 */
export function splitSale(price: number): SaleSplit {
  const p = Math.max(0, Math.round(price));
  const platformFee = Math.round((p * CREATOR_PLATFORM_FEE_PERCENT) / 100);
  const vat = Math.round((p * VAT_PERCENT) / 100);
  // Paystack charges its percentage on the full amount it collects, so the fee
  // is grossed up: charge = (everything else) / (1 - rate).
  const beforeFee = p + platformFee + vat;
  const rate = PAYSTACK_FEE_PERCENT / 100;
  const processingFee = Math.max(0, Math.round(beforeFee / (1 - rate)) - beforeFee);
  return {
    price: p, vat, processingFee,
    gross: beforeFee + processingFee,
    platformFee, creatorShare: p,
  };
}

/** Creator wallet balance: completed income minus withdrawals. */
export async function creatorBalance(creatorId: string): Promise<{ balance: number; earned: number; withdrawn: number }> {
  const admin = createAdminClient();
  const { data } = await admin.from("creator_wallet_transactions")
    .select("type, amount, status").eq("creator_id", creatorId);
  let earned = 0, withdrawn = 0;
  (data as { type: string; amount: number; status: string }[] | null)?.forEach((t) => {
    if (t.status === "failed") return;
    if (t.type === "income" && t.status === "completed") earned += t.amount || 0;
    if (t.type === "withdrawal") withdrawn += t.amount || 0;   // pending holds the funds
  });
  return { balance: Math.max(0, earned - withdrawn), earned, withdrawn };
}

/**
 * Tomora's own wallet balance. VAT is tracked separately so a full
 * withdrawal never sweeps money owed to the tax authority.
 */
export async function platformBalance(): Promise<{ balance: number; earned: number; withdrawn: number; vatHeld: number }> {
  const admin = createAdminClient();
  const { data } = await admin.from("platform_wallet_transactions")
    .select("type, amount, status, is_vat");
  let earned = 0, withdrawn = 0, vatHeld = 0;
  (data as { type: string; amount: number; status: string; is_vat: boolean }[] | null)?.forEach((t) => {
    if (t.status === "failed") return;
    if (t.is_vat) { if (t.type === "income") vatHeld += t.amount || 0; else vatHeld -= t.amount || 0; return; }
    if (t.type === "income" && t.status === "completed") earned += t.amount || 0;
    if (t.type === "withdrawal") withdrawn += t.amount || 0;
  });
  return { balance: Math.max(0, earned - withdrawn), earned, withdrawn, vatHeld: Math.max(0, vatHeld) };
}

/** Credits Tomora's wallet. Idempotent per (type, reference, source). */
export async function creditPlatform(input: {
  source: string; amount: number; reference?: string; description?: string; isVat?: boolean;
}): Promise<void> {
  if (!input.amount || input.amount <= 0) return;
  const admin = createAdminClient();
  await admin.from("platform_wallet_transactions").insert({
    type: "income", source: input.source, amount: Math.round(input.amount),
    status: "completed", reference: input.reference || null,
    description: input.description || null, is_vat: !!input.isVat,
  });
}

/** Credits a creator's wallet. Idempotent per (type, reference). */
export async function creditCreator(input: {
  creatorId: string; courseId?: string; amount: number; reference?: string; description?: string;
  /**
   * `settled` for a sale Paystack paid straight into their bank: it belongs in
   * their history but not in their balance, because Tomora is not holding it
   * and paying it out would pay for the sale twice. Only `completed` counts
   * towards what they can withdraw.
   */
  status?: "completed" | "settled";
}): Promise<void> {
  if (!input.amount || input.amount <= 0) return;
  const admin = createAdminClient();
  await admin.from("creator_wallet_transactions").insert({
    creator_id: input.creatorId, course_id: input.courseId || null,
    type: "income", source: "course_sale", amount: Math.round(input.amount),
    status: input.status || "completed", reference: input.reference || null,
    description: input.description || null,
  });
}

/** Writes one row into the unified ledger. Idempotent per (kind, reference). */
export async function recordTransaction(input: {
  kind: "subscription" | "domain" | "creator_course" | "academy_course" | "designs" | "store_order" | "donation" | "resource";
  reference?: string;
  grossAmount: number;
  platformAmount?: number;
  payeeAmount?: number;
  vatAmount?: number;
  userId?: string;
  studentId?: string;
  creatorId?: string;
  siteId?: string;
  description?: string;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("transactions").insert({
    kind: input.kind,
    reference: input.reference || null,
    gross_amount: Math.round(input.grossAmount || 0),
    platform_amount: Math.round(input.platformAmount || 0),
    payee_amount: Math.round(input.payeeAmount || 0),
    vat_amount: Math.round(input.vatAmount || 0),
    user_id: input.userId || null,
    student_id: input.studentId || null,
    creator_id: input.creatorId || null,
    site_id: input.siteId || null,
    description: input.description || null,
  });
}
