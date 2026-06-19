"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentSiteId } from "@/lib/dashboard";
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
  images: string[];
  category?: string;
  stock: number;
  is_active: boolean;
}

export async function saveProduct(input: ProductInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId, siteId } = await requireUserAndSite();
    if (!input.name?.trim()) return { ok: false, error: "Name is required." };

    const row = {
      user_id: userId,
      site_id: siteId,
      name: input.name.trim(),
      description: input.description || null,
      price: Math.max(0, Math.round(input.price || 0)),
      images: (input.images || []).slice(0, 5),
      category: input.category || null,
      stock: Math.max(0, Math.round(input.stock || 0)),
      is_active: input.is_active,
    };

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
  paystackPublicKey: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, siteId } = await requireUserAndSite();
    const { error } = await supabase
      .from("sites")
      .update({
        paystack_public_key: input.paystackPublicKey || null,
        bank_name: input.bankName || null,
        account_number: input.accountNumber || null,
        account_name: input.accountName || null,
      })
      .eq("id", siteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/payouts");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
