"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentSiteId } from "@/lib/dashboard";
import { resolveAccount, createSubaccount } from "@/lib/paystack";
import { STORE_COMMISSION_PERCENT } from "@/lib/constants";
import type { OrderStatus } from "@/lib/database.types";

async function requireUserAndSite() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const siteId = await currentSiteId(user.id);
  if (!siteId) throw new Error("No site found.");
  // Rows created from the dashboard belong to the site's owner — for staff
  // members that's the account owner, not the staff user themselves.
  const { data: site } = await supabase.from("sites").select("user_id").eq("id", siteId).maybeSingle();
  const ownerId = (site?.user_id as string) || user.id;
  return { supabase, userId: user.id, ownerId, siteId };
}

export interface ProductInput {
  id?: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category?: string;
  stock: number;
  is_active: boolean;
  isBestSeller?: boolean;
  isOffer?: boolean;
  isNewArrival?: boolean;
  offerPercent?: number;
  colors?: string[];
  colorVariants?: { name: string; image?: string }[];
}

export async function saveProduct(input: ProductInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, ownerId, siteId } = await requireUserAndSite();
    if (!input.name?.trim()) return { ok: false, error: "Name is required." };

    const row: Record<string, unknown> = {
      user_id: ownerId,
      site_id: siteId,
      name: input.name.trim(),
      description: input.description || null,
      price: Math.max(0, Math.round(input.price || 0)),
      images: (input.images || []).slice(0, 5),
      category: input.category || null,
      stock: Math.max(0, Math.round(input.stock || 0)),
      is_active: input.is_active,
      is_best_seller: !!input.isBestSeller,
      is_offer: !!input.isOffer,
      is_new_arrival: !!input.isNewArrival,
      offer_percent: Math.max(0, Math.min(100, Math.round(input.offerPercent || 0))),
      colors: (() => {
        const fromVariants = (input.colorVariants || []).map((v) => String(v.name || "").trim()).filter(Boolean);
        const base = fromVariants.length ? fromVariants : (input.colors || []).map((c) => String(c).trim()).filter(Boolean);
        return base.slice(0, 20);
      })(),
      color_variants: (input.colorVariants || [])
        .map((v) => ({ name: String(v.name || "").trim(), image: v.image || undefined }))
        .filter((v) => v.name)
        .slice(0, 20),
    };
    // Only include compare_price when set, so saving still works before the
    // 0006 migration adds the column.
    if (input.comparePrice) row.compare_price = Math.max(0, Math.round(input.comparePrice));

    if (input.id) {
      const { error } = await supabase.from("products").update(row).eq("id", input.id).eq("user_id", ownerId);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("products").insert(row);
      if (error) return { ok: false, error: error.message };
    }
    revalidatePath("/dashboard/products");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, ownerId } = await requireUserAndSite();
    const { error } = await supabase.from("products").delete().eq("id", id).eq("user_id", ownerId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/products");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireUserAndSite();
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/orders");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function savePayoutSettings(input: {
  bankCode: string;
  bankName: string;
  accountNumber: string;
}): Promise<{ ok: boolean; error?: string; accountName?: string }> {
  try {
    const { supabase, userId, siteId } = await requireUserAndSite();

    const bankCode = (input.bankCode || "").trim();
    const accountNumber = (input.accountNumber || "").trim();
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
      return { ok: false, error: "Select your bank and enter a valid 10-digit account number." };
    }

    // Changing an already-connected payout bank needs an approved change request.
    const { data: siteRow } = await supabase.from("sites").select("paystack_subaccount").eq("id", siteId).maybeSingle();
    const isChange = !!siteRow?.paystack_subaccount;
    let approvedReqId: string | null = null;
    if (isChange) {
      const { data: req } = await supabase
        .from("payout_change_requests")
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!req) {
        return { ok: false, error: "Changing your payout bank needs admin approval. Please request access first." };
      }
      approvedReqId = req.id;
    }

    // Verify the account, then create a Paystack subaccount so sales settle
    // straight to this bank.
    let accountName: string;
    let subaccountCode: string;
    try {
      accountName = await resolveAccount(accountNumber, bankCode);
      const sub = await createSubaccount({
        businessName: accountName,
        bankCode,
        accountNumber,
        percentageCharge: STORE_COMMISSION_PERCENT,
      });
      subaccountCode = sub.subaccountCode;
    } catch (e: any) {
      return { ok: false, error: e.message || "Could not verify your bank account." };
    }

    const { error } = await supabase
      .from("sites")
      .update({
        bank_code: bankCode,
        bank_name: input.bankName || null,
        account_number: accountNumber,
        account_name: accountName,
        paystack_subaccount: subaccountCode,
      })
      .eq("id", siteId);
    if (error) return { ok: false, error: error.message };

    // Consume the approved change request so a fresh approval is needed next time.
    if (approvedReqId) {
      await createAdminClient()
        .from("payout_change_requests")
        .update({ status: "used" })
        .eq("id", approvedReqId);
    }
    revalidatePath("/dashboard/payouts");
    return { ok: true, accountName };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/**
 * Requests admin permission to change an already-connected payout bank. The
 * user uploads proof of ownership of the new account (e.g. a bank statement
 * showing a matching name). Once an admin approves, they can save new details.
 */
export async function requestPayoutChange(input: { proofUrl?: string; note?: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId, siteId } = await requireUserAndSite();
    if (!input.proofUrl) {
      return { ok: false, error: "Please upload proof of ownership of the new account (image or PDF)." };
    }
    // One active request at a time.
    const { data: existing } = await supabase
      .from("payout_change_requests")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.status === "pending") return { ok: false, error: "You already have a request under review." };
    if (existing?.status === "approved") return { ok: false, error: "Your request is approved — you can update your bank now." };

    const { error } = await supabase.from("payout_change_requests").insert({
      user_id: userId,
      site_id: siteId,
      proof_url: input.proofUrl,
      note: (input.note || "").slice(0, 500) || null,
      status: "pending",
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/payouts");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Saves which checkout payment methods are enabled + who bears the Paystack fee. */
export async function savePaymentSettings(input: {
  paystack: boolean;
  transfer: boolean;
  feeBearer: "customer" | "owner";
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, siteId } = await requireUserAndSite();
    const { data: site } = await supabase.from("sites").select("id, site_data").eq("id", siteId).maybeSingle();
    if (!site) return { ok: false, error: "No site found." };
    const sd = (site.site_data || {}) as any;
    const updated = {
      ...sd,
      paymentMethods: { paystack: !!input.paystack, transfer: !!input.transfer },
      feeBearer: input.feeBearer === "customer" ? "customer" : "owner",
    };
    const { error } = await supabase.from("sites").update({ site_data: updated }).eq("id", site.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/payouts");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
