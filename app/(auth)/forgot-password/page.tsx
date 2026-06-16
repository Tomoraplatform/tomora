import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Reset Password — Tomora" };

export default function ForgotPasswordPage() {
  return (
    <Card className="border-ink/10 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>We&apos;ll email you a secure reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotForm />
      </CardContent>
    </Card>
  );
}
