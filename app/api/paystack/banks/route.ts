import { NextResponse } from "next/server";
import { listBanks } from "@/lib/paystack";

/** Returns the list of Nigerian banks for the payout bank selector. */
export async function GET() {
  try {
    const banks = await listBanks();
    return NextResponse.json({ banks });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not load banks." }, { status: 500 });
  }
}
