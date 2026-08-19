import type { DataMode } from "@/lib/sandbox";

/**
 * The single place that decides whether a query sees real or test rows.
 *
 * Orders are read from a dozen places: the storefront, the order list, the
 * revenue charts, the wallet, the reviews check. If any one of them forgot the
 * flag it would quietly mix sandbox money into a seller's real takings, so
 * every one of those reads goes through here and has to name the world it
 * wants. Nothing filters by omission.
 *
 * Usage:
 *   scopeToMode(supabase.from("orders").select("*").eq("site_id", id), mode)
 *   realOnly(supabase.from("orders").select("amount"))   // customer-facing
 */

/**
 * Supabase's builder types are deep enough that constraining these helpers to
 * them makes the compiler give up on long selects, so each takes the builder
 * unconstrained and narrows only to call `.eq()`.
 */
type Eq<T> = { eq(column: string, value: unknown): T };

/** Restricts a query to one world. `test` shows only sandbox rows. */
export function scopeToMode<T>(query: T, mode: DataMode): T {
  return (query as Eq<T>).eq("is_test", mode === "test");
}

/**
 * Restricts a query to real rows, whatever the viewer's mode.
 *
 * For anything a customer sees, anything that moves money, and anything
 * exported or reported as the business's own numbers. Sandbox rows must never
 * appear in these, so the mode is deliberately not a parameter.
 */
export function realOnly<T>(query: T): T {
  return (query as Eq<T>).eq("is_test", false);
}

/** Products an admin made for demos are never offered to a real customer. */
export function excludeTestProducts<T>(query: T): T {
  return (query as Eq<T>).eq("is_test_only", false);
}
