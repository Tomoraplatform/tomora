import { ForgotForm } from "@/components/auth/auth-forms";

export const metadata = { robots: { index: false, follow: false }, title: "Reset Password | Tomora" };

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
