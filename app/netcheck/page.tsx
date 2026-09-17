import type { Metadata } from "next";
import { NetcheckClient } from "@/components/netcheck/netcheck-client";

/**
 * A page we hand to people who report that Tomora is slow on their network.
 * Static, outside every gate, and nothing else links to it.
 */
export const metadata: Metadata = {
  title: "Network check",
  description: "Measure how fast this phone reaches Tomora.",
  robots: { index: false, follow: false },
};

export default function NetcheckPage() {
  return <NetcheckClient />;
}
