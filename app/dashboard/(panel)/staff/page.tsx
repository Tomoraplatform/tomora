import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { TEAM_PLANS } from "@/lib/constants";
import { StaffManager, type StaffRow } from "@/components/dashboard/staff-manager";

export const metadata = { title: "Staff | Tomora" };

export default async function StaffPage() {
  const { userId, subscription, isStaff } = await getDashboardData();
  // Staff members can't manage the team, owners only.
  if (isStaff) redirect("/dashboard");

  const planId = subscription?.status === "active" ? subscription.plan || "" : "";
  const hasTeamPlan = TEAM_PLANS.includes(planId);

  const supabase = createClient();
  const { data } = await supabase
    .from("staff_members")
    .select("id, name, role, email, phone, areas, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });

  return <StaffManager staff={(data as StaffRow[]) || []} hasTeamPlan={hasTeamPlan} />;
}
