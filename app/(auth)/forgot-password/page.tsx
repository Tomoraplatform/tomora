import { ForgotForm } from "@/components/auth/auth-forms";

export const metadata = { robots: { index: false, follow: false }, title: "Reset Password" };

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
