import { SignupForm } from "@/components/auth/auth-forms";

export const metadata = {
  title: "Create Your Free Website",
  description: "Create a free Tomora account and publish your business website or online store in minutes. No code, no credit card. Accept payments with Paystack.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return <SignupForm />;
}
