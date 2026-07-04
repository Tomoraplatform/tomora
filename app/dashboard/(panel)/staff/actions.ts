"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { TEAM_PLANS, STAFF_AREAS, APP_DOMAIN } from "@/lib/constants";

async function requireGrowthOwner() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data: sub } = await supabase
    .from("subscriptions").select("plan, status").eq("user_id", user.id).maybeSingle();
  const planId = sub?.status === "active" ? (sub.plan || "") : "";
  if (!TEAM_PLANS.includes(planId)) {
    throw new Error("Staff accounts are included in the Growth plan and above. Upgrade to add staff.");
  }
  return { supabase, user };
}

export interface StaffInput {
  name: string;
  role?: string;
  email: string;
  phone?: string;
  areas: string[];
}

/** Adds a staff member and emails them an invite. */
export async function addStaff(input: StaffInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireGrowthOwner();

    const name = String(input.name || "").trim().slice(0, 120);
    const email = String(input.email || "").trim().toLowerCase().slice(0, 160);
    const validAreaIds = STAFF_AREAS.map((a) => a.id);
    const areas = (input.areas || []).filter((a) => validAreaIds.includes(a));
    if (!name) return { ok: false, error: "Enter the staff member's name." };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
    if (email === (user.email || "").toLowerCase()) return { ok: false, error: "That's your own email — you already have full access." };
    if (!areas.length) return { ok: false, error: "Select at least one area they can access." };

    const { error } = await supabase.from("staff_members").insert({
      owner_id: user.id,
      name,
      role: String(input.role || "").trim().slice(0, 80) || null,
      email,
      phone: String(input.phone || "").trim().slice(0, 40) || null,
      areas,
    });
    if (error) {
      if (/duplicate|unique/i.test(error.message)) return { ok: false, error: "You've already added someone with that email." };
      return { ok: false, error: error.message };
    }

    // Invite email (best-effort).
    const areaLabels = STAFF_AREAS.filter((a) => areas.includes(a.id)).map((a) => a.label).join(", ");
    await sendEmail({
      to: email,
      subject: "You've been added to a Tomora dashboard",
      html: `
        <h2>You've been invited</h2>
        <p>${name.split(" ")[0] || "Hi"}, you've been given staff access to a business dashboard on Tomora${input.role ? ` as <strong>${String(input.role).trim()}</strong>` : ""}.</p>
        <p><strong>You can manage:</strong> ${areaLabels}</p>
        <p>Sign in (or create a free account) with <strong>this email address</strong> to get access:</p>
        <p><a href="https://${APP_DOMAIN}/login">https://${APP_DOMAIN}/login</a></p>`,
    });

    revalidatePath("/dashboard/staff");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Updates a staff member's areas / details. */
export async function updateStaff(id: string, patch: Partial<StaffInput>): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireGrowthOwner();
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = String(patch.name).trim().slice(0, 120);
    if (patch.role !== undefined) row.role = String(patch.role || "").trim().slice(0, 80) || null;
    if (patch.phone !== undefined) row.phone = String(patch.phone || "").trim().slice(0, 40) || null;
    if (patch.areas !== undefined) {
      const validAreaIds = STAFF_AREAS.map((a) => a.id);
      row.areas = (patch.areas || []).filter((a) => validAreaIds.includes(a));
    }
    const { error } = await supabase.from("staff_members").update(row).eq("id", id).eq("owner_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/staff");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Removes a staff member — their access ends immediately. */
export async function removeStaff(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const { error } = await supabase.from("staff_members").delete().eq("id", id).eq("owner_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/staff");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
