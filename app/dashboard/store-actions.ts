"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  return { supabase, userId: user.id, siteId };
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
}

export async function saveProduct(input: ProductInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId, siteId } = await requireUserAndSite();
    if (!input.name?.trim()) return { ok: false, error: "Name is required." };

    const row: Record<string, unknown> = {
      user_id: userId,
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
    };
    // Only include compare_price when set, so saving still works before the
    // 0006 migration adds the column.
    if (input.comparePrice) row.compare_price = Math.max(0, Math.round(input.comparePrice));

    if (input.id) {
      const { error } = await supabase.from("products").update(row).eq("id", input.id).eq("user_id", userId);
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
    const { supabase, userId } = await requireUserAndSite();
    const { error } = await supabase.from("products").delete().eq("id", id).eq("user_id", userId);
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
    const { supabase, siteId } = await requireUserAndSite();

    const bankCode = (input.bankCode || "").trim();
    const accountNumber = (input.accountNumber || "").trim();
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
      return { ok: false, error: "Select your bank and enter a valid 10-digit account number." };
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
    revalidatePath("/dashboard/payouts");
    return { ok: true, accountName };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
