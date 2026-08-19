"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MODE_COOKIE, sandboxAllowed } from "@/lib/sandbox";
import { createCatalogContent, isCatalogTemplate, catalogTemplate, type CatalogCategoryId } from "@/lib/catalog";
import type { SiteCategory } from "@/lib/database.types";

type R = { ok: boolean; error?: string };

/**
 * Sandbox writes are the only place test rows are created, so each one checks
 * the caller itself rather than trusting the cookie or the page that called it.
 */
async function requireSandbox() {
  if (!(await sandboxAllowed())) throw new Error("Not allowed.");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  return { supabase, userId: user.id };
}

/** Flips the admin between real and test data. */
export async function setMode(mode: "real" | "test"): Promise<R> {
  if (mode === "test" && !(await sandboxAllowed())) return { ok: false, error: "Not allowed." };
  cookies().set(MODE_COOKIE, mode, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

function toDbCategory(cat: string): SiteCategory {
  const map: Record<CatalogCategoryId, SiteCategory> = {
    shop: "ecommerce", portfolio: "creator", education: "business",
    organization: "organization", events: "organization", artisan: "creator", food: "ecommerce",
  };
  return map[cat as CatalogCategoryId] ?? "business";
}

/**
 * Creates (or re-skins) the demo store sandbox orders are written against, so
 * test rows never land in a shop a real seller is running. It is never
 * published, so nothing about it is reachable from the public web.
 */
export async function createDemoSite(templateId: string): Promise<R & { siteId?: string }> {
  try {
    const { supabase, userId } = await requireSandbox();
    if (!isCatalogTemplate(templateId)) return { ok: false, error: "Unknown template." };
    const tpl = catalogTemplate(templateId)!;

    const { data: existing } = await supabase
      .from("sites").select("id").eq("user_id", userId).eq("is_demo", true).maybeSingle();

    const siteData = createCatalogContent(templateId, {
      businessName: "Tomora Demo", brandColor: "#022245", demoCombos: false,
    });

    if (existing) {
      const { error } = await supabase
        .from("sites")
        .update({ template_id: templateId, category: toDbCategory(tpl.category), site_data: siteData })
        .eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      revalidatePath("/dashboard/sandbox");
      return { ok: true, siteId: existing.id };
    }

    let subdomain = `tomora-demo-${Math.floor(Math.random() * 9000 + 1000)}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from("sites")
        .insert({
          user_id: userId, template_id: templateId, category: toDbCategory(tpl.category),
          subdomain, domain_status: "none", is_live: false, is_demo: true, site_data: siteData,
        })
        .select("id")
        .single();
      if (!error && data) {
        revalidatePath("/dashboard/sandbox");
        return { ok: true, siteId: data.id };
      }
      if (error?.code === "23505") { subdomain = `tomora-demo-${Math.floor(Math.random() * 90000 + 10000)}`; continue; }
      return { ok: false, error: error?.message || "Could not create the demo store." };
    }
    return { ok: false, error: "Could not find a free demo address." };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Adds a demo product to the demo store. Never offered on a real storefront. */
export async function createTestProduct(input: {
  siteId: string; name: string; price: number; image?: string;
}): Promise<R> {
  try {
    const { supabase, userId } = await requireSandbox();
    const { data: site } = await supabase.from("sites").select("id, user_id").eq("id", input.siteId).maybeSingle();
    if (!site || site.user_id !== userId) return { ok: false, error: "That store is not yours." };
    if (!input.name?.trim()) return { ok: false, error: "Give the product a name." };

    const admin = createAdminClient();
    const { error } = await admin.from("products").insert({
      user_id: userId, site_id: input.siteId, name: input.name.trim(),
      description: "Sandbox product, not for sale.",
      price: Math.max(0, Math.round(input.price || 0)),
      images: input.image ? [input.image] : [], stock: 999, is_active: true, is_test_only: true,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/sandbox");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export interface TestOrderInput {
  siteId: string;
  buyer: { name: string; email: string; phone?: string; address?: string };
  items: { productId: string; qty: number }[];
  /** Which ending to rehearse. Only `paid` credits the sandbox wallet. */
  outcome: "paid" | "pending" | "failed";
}

/**
 * Writes a simulated sale.
 *
 * It uses the same tables, the same one-row-per-item shape and the same
 * reference grouping as a real order, so the order list, fulfilment and the
 * revenue charts behave exactly as they would in production. What it never does
 * is reach Paystack or email the buyer: the reference carries an `sbx_` prefix
 * that no webhook path recognises, and nothing is sent from here.
 */
export async function createTestOrder(input: TestOrderInput): Promise<R & { reference?: string }> {
  try {
    const { supabase, userId } = await requireSandbox();
    if (!input.items?.length) return { ok: false, error: "Add at least one product." };
    if (!input.buyer?.name || !input.buyer?.email) return { ok: false, error: "The test customer needs a name and email." };

    // The store must belong to this admin, so a sandbox order can never be
    // written into somebody else's shop.
    const { data: site } = await supabase
      .from("sites").select("id, user_id").eq("id", input.siteId).maybeSingle();
    if (!site || site.user_id !== userId) return { ok: false, error: "That store is not yours." };

    const ids = input.items.map((i) => i.productId);
    const { data: products } = await supabase
      .from("products").select("id, name, price").in("id", ids).eq("site_id", input.siteId);
    if (!products?.length) return { ok: false, error: "Those products are not in this store." };

    const reference = `sbx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // A failed payment leaves the order behind exactly as a real one does:
    // recorded, unpaid, never credited.
    const status = input.outcome === "paid" ? "paid" : "pending";
    let total = 0;
    const rows = input.items.flatMap((item) => {
      const p = products.find((x) => x.id === item.productId);
      if (!p) return [];
      const qty = Math.max(1, Math.min(99, item.qty || 1));
      const amount = p.price * qty;
      total += amount;
      return [{
        site_id: input.siteId, product_id: p.id,
        buyer_name: input.buyer.name, buyer_email: input.buyer.email,
        buyer_phone: input.buyer.phone || null, buyer_address: input.buyer.address || null,
        amount, color: qty > 1 ? `x${qty}` : null,
        paystack_reference: reference, status, seen: false, is_test: true,
      }];
    });
    if (!rows.length) return { ok: false, error: "Nothing to order." };

    const admin = createAdminClient();
    const { error } = await admin.from("orders").insert(rows);
    if (error) return { ok: false, error: error.message };

    if (input.outcome === "paid") {
      // Mirrors settling a real payment, flagged so it stays out of the balance
      // a withdrawal is paid from and out of Tomora's own revenue reporting.
      await admin.from("wallet_transactions").insert({
        user_id: userId, site_id: input.siteId, type: "income", source: "order",
        amount: total, status: "completed", reference,
        description: `Sandbox order from ${input.buyer.name}`, is_test: true,
      });
      await admin.from("transactions").insert({
        kind: "store_order", reference, gross_amount: total, platform_amount: 0,
        payee_amount: total, vat_amount: 0, user_id: userId, site_id: input.siteId,
        description: `Sandbox order from ${input.buyer.name}`, is_test: true,
      });
    }

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/sandbox");
    revalidatePath("/dashboard/milestones");
    return { ok: true, reference };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Removes every test row belonging to this admin, in one go. */
export async function clearTestData(): Promise<R & { orders?: number }> {
  try {
    const { supabase, userId } = await requireSandbox();
    const { data: sites } = await supabase.from("sites").select("id").eq("user_id", userId);
    const siteIds = (sites || []).map((s) => s.id);
    const admin = createAdminClient();

    let orders = 0;
    if (siteIds.length) {
      const { data: deleted } = await admin
        .from("orders").delete().eq("is_test", true).in("site_id", siteIds).select("id");
      orders = deleted?.length || 0;
    }
    await admin.from("wallet_transactions").delete().eq("is_test", true).eq("user_id", userId);
    await admin.from("transactions").delete().eq("is_test", true).eq("user_id", userId);

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/sandbox");
    revalidatePath("/dashboard/milestones");
    return { ok: true, orders };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
