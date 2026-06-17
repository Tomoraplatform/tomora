/**
 * Paystack server helpers. The secret key is ONLY ever read here, in
 * server-side code. Never import this file into a Client Component.
 */
import { COURSE_NAME } from "@/lib/constants";

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export interface InitializeArgs {
  email: string;
  fullName: string;
  amountMinor: number; // kobo
  currency: string;
  reference: string;
  callbackUrl: string;
}

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(
  args: InitializeArgs,
): Promise<PaystackInitResponse> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: args.email,
      amount: args.amountMinor,
      currency: args.currency,
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: {
        full_name: args.fullName,
        email: args.email,
        course_name: COURSE_NAME,
      },
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Failed to initialize Paystack transaction");
  }
  return json.data as PaystackInitResponse;
}

export interface PaystackVerifyData {
  status: string; // "success"
  reference: string;
  amount: number; // kobo
  currency: string;
  customer: { email: string; customer_code: string };
  metadata?: { full_name?: string; email?: string; course_name?: string };
}

export async function verifyTransaction(
  reference: string,
): Promise<PaystackVerifyData> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey()}` },
      cache: "no-store",
    },
  );

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Failed to verify Paystack transaction");
  }
  return json.data as PaystackVerifyData;
}

export function makeReference(email: string) {
  const slug = email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 12);
  return `MEI_${slug}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
