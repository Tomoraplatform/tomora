import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { isAdmin } from "@/lib/admin";

/**
 * Sandbox mode: a way for the team to run a whole sale through the product,
 * from cart to fulfilment to revenue, without touching a payment processor, a
 * real customer, or a real seller's numbers.
 *
 * Test rows live in the same tables as real ones behind an `is_test` flag, so
 * the sandbox exercises the same code a genuine order does. What keeps the two
 * apart is that every read states which world it wants: see `lib/orders/query`.
 */
export type DataMode = "real" | "test";

export const MODE_COOKIE = "tomora_mode";

/**
 * Who may use the sandbox. Today that is platform admins only; widening it to
 * sellers later is a change to this one function.
 */
export const sandboxAllowed = cache(async (): Promise<boolean> => isAdmin());

/**
 * The mode the current admin is working in.
 *
 * Anyone who is not allowed to use the sandbox is always in real mode, whatever
 * the cookie says, so a stale cookie or a hand-set one can never show test data
 * to a seller or hide their real orders.
 */
export const currentMode = cache(async (): Promise<DataMode> => {
  if (cookies().get(MODE_COOKIE)?.value !== "test") return "real";
  return (await sandboxAllowed()) ? "test" : "real";
});

/** True when the flag a row should carry in the current mode. */
export async function currentIsTest(): Promise<boolean> {
  return (await currentMode()) === "test";
}
