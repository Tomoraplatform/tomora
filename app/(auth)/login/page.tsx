import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Log In — Tomora" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <Card className="border-ink/10 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Log in to manage your Tomora site.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={searchParams.next} />
      </CardContent>
    </Card>
  );
}
