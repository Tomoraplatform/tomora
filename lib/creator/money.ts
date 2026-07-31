import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { VAT_PERCENT, PAYSTACK_FEE_PERCENT } from "@/lib/constants";

/** Tomora's cut of every creator course sale. */
export const CREATOR_PLATFORM_FEE_PERCENT = 5;
/** Minimum withdrawal from any Tomora wallet. */
export const MIN_WITHDRAWAL = 5000;

export interface SaleSplit {
  /** Course price before VAT. */
  price: number;
  /** VAT added on top, charged to the student. */
  vat: number;
  /** Paystack's processing fee, also charged to the student. */
  processingFee: number;
  /** What the student actually pays (price + VAT + processing fee). */
  gross: number;
  /** Tomora's 5% platform fee (from the price, not the VAT or the fee). */
  platformFee: number;
  /** What the creator receives into their wallet. */
  creatorShare: number;
}

/**
 * Splits a creator course sale. The student covers VAT and Paystack's
 * processing fee, so the creator always nets price minus Tomora's 5%.
 *
 * Example, ₦10,000 course: student pays ₦11,019
 * (₦10,000 + ₦750 VAT + ₦269 processing), Tomora keeps ₦500,
 * creator receives ₦9,500.
 */
export function splitSale(price: number): SaleSplit {
  const p = Math.max(0, Math.round(price));
  const vat = Math.round((p * VAT_PERCENT) / 100);
  const platformFee = Math.round((p * CREATOR_PLATFORM_FEE_PERCENT) / 100);
  // Paystack charges its percentage on the full amount it collects, so the fee
  // is grossed up: charge = (price + vat) / (1 - rate).
  const beforeFee = p + vat;
  const rate = PAYSTACK_FEE_PERCENT / 100;
  const processingFee = Math.max(0, Math.round(beforeFee / (1 - rate)) - beforeFee);
  return {
    price: p, vat, processingFee,
    gross: beforeFee + processingFee,
    platformFee, creatorShare: p - platformFee,
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
}): Promise<void> {
  if (!input.amount || input.amount <= 0) return;
  const admin = createAdminClient();
  await admin.from("creator_wallet_transactions").insert({
    creator_id: input.creatorId, course_id: input.courseId || null,
    type: "income", source: "course_sale", amount: Math.round(input.amount),
    status: "completed", reference: input.reference || null,
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
