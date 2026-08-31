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
  /** Settle to a store owner's subaccount (split payment). */
  subaccount?: string;
  /** Who bears Paystack's fees when a subaccount is used. */
  bearer?: "account" | "subaccount";
  /** A flat cut, in naira, for the main account when splitting to a subaccount.
   *  Used by Tomora Live to take its commission at the point of payment rather
   *  than by holding the seller's money first. */
  transactionCharge?: number;
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
      ...(params.subaccount ? { subaccount: params.subaccount, bearer: params.bearer || "subaccount" } : {}),
      ...(params.subaccount && params.transactionCharge
        ? { transaction_charge: Math.round(params.transactionCharge * 100) }
        : {}),
    }),
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message || "Paystack init failed");
  return json.data as InitResult;
}

/** Lists Nigerian banks (name + code) for the payout bank selector. */
export async function listBanks(): Promise<{ name: string; code: string }[]> {
  const res = await fetch(`${PAYSTACK_BASE}/bank?currency=NGN&perPage=100`, {
    headers: { Authorization: `Bearer ${secret()}` },
    next: { revalidate: 86400 },
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message || "Could not load banks");
  return (json.data as any[]).map((b) => ({ name: b.name, code: b.code }));
}

/** Resolves a bank account number to its account name (verifies it exists). */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<string> {
  const res = await fetch(
    `${PAYSTACK_BASE}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    { headers: { Authorization: `Bearer ${secret()}` }, signal: AbortSignal.timeout(15000) }
  );
  const json = await res.json();
  if (!json.status) throw new Error(json.message || "Could not verify account number.");
  return json.data.account_name as string;
}

/**
 * Creates a Paystack subaccount so a store's sales settle to the owner's bank
 * automatically. percentageCharge is the platform's commission %.
 */
export async function createSubaccount(params: {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge?: number;
}): Promise<{ subaccountCode: string }> {
  const res = await fetch(`${PAYSTACK_BASE}/subaccount`, {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      business_name: params.businessName,
      settlement_bank: params.bankCode,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge ?? 0,
    }),
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message || "Could not set up payouts.");
  return { subaccountCode: json.data.subaccount_code as string };
}

/** Updates a subaccount's commission split (percentage charge). */
export async function updateSubaccount(code: string, percentageCharge: number): Promise<boolean> {
  const res = await fetch(`${PAYSTACK_BASE}/subaccount/${encodeURIComponent(code)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ percentage_charge: percentageCharge }),
  });
  const json = await res.json();
  return !!json.status;
}

/** Creates (or reuses) a transfer recipient for a bank account. Returns recipient_code. */
export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
}): Promise<string> {
  const res = await fetch(`${PAYSTACK_BASE}/transferrecipient`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "nuban",
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: "NGN",
    }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (!json.status || !json.data?.recipient_code) {
    throw new Error(json.message || "Could not set up the transfer recipient.");
  }
  return json.data.recipient_code as string;
}

/** Initiates a Paystack transfer (withdrawal) to a recipient. */
export async function initiateTransfer(params: {
  amountNaira: number;
  recipient: string;
  reference: string;
  reason?: string;
}): Promise<{ status: string; transferCode?: string }> {
  const res = await fetch(`${PAYSTACK_BASE}/transfer`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(params.amountNaira * 100),
      recipient: params.recipient,
      reference: params.reference,
      reason: params.reason || "Tomora wallet withdrawal",
    }),
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message || "Transfer failed.");
  return { status: json.data?.status || "pending", transferCode: json.data?.transfer_code };
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
