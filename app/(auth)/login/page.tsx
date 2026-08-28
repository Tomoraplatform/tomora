import { LoginForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Log In | Tomora" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return <LoginForm next={searchParams.next} />;
}
