import { getDashboardData } from "@/lib/dashboard";
import { AccountForm } from "@/components/dashboard/account-form";

export const metadata = { title: "Account — Tomora" };

export default async function AccountPage() {
  const { email } = await getDashboardData();
  return <AccountForm email={email || ""} />;
}
