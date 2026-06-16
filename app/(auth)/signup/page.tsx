import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Get Started — Tomora" };

export default function SignupPage() {
  return (
    <Card className="border-ink/10 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Start free for 14 days</CardTitle>
        <CardDescription>No credit card required. Go live in minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
