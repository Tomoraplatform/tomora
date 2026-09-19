import { LoginForm } from "@/components/auth/auth-forms";

export const metadata = {
  title: "Log In",
  description: "Log in to your Tomora dashboard to edit your website, manage products and orders, and see your sales.",
  alternates: { canonical: "/login" },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return <LoginForm next={searchParams.next} />;
}
