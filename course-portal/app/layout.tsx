import type { Metadata } from "next";
import "./globals.css";
import { COURSE_NAME, COURSE_PROMISE } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: COURSE_NAME,
    template: `%s — ${COURSE_NAME}`,
  },
  description: COURSE_PROMISE,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
