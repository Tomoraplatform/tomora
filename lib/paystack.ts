import "server-only";

const PAYSTACK_BASE = "https://api.paystack.co";

function secret() {
  return process.env.PAYSTACK_SECRET_KEY || "";
}

export interface InitResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

/** Initialize a Paystack transaction. amount is in Naira (converted to kobo). */
export async function initTransaction(params: {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<InitResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100),
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message || "Paystack init failed");
  return json.data as InitResult;
}

/** Verify a Paystack transaction by reference. */
export async function verifyTransaction(reference: string): Promise<{
  success: boolean;
  amountNaira: number;
  metadata?: any;
}> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
  });
  const json = await res.json();
  const data = json.data;
  return {
    success: json.status && data?.status === "success",
    amountNaira: data ? data.amount / 100 : 0,
    metadata: data?.metadata,
  };
}
