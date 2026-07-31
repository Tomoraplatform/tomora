import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Buying a resource does not create an account, so the buyer's email is their
 * identity. After payment we hand the browser a signed token carrying that
 * email; the same token goes out by email so they can unlock the library again
 * on another device. The signature is what makes it unforgeable, so nobody can
 * type in someone else's address and inherit their purchases.
 */

export const ACCESS_COOKIE = "tomora_resources";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 365; // a year

function secret(): string {
  const s = process.env.RESOURCE_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("RESOURCE_TOKEN_SECRET is not set");
  return s;
}

const b64url = (b: Buffer) => b.toString("base64url");

function sign(payload: string): string {
  return b64url(createHmac("sha256", secret()).update(payload).digest());
}

/** Builds the signed token for an email address. */
export function makeAccessToken(email: string): string {
  const payload = b64url(Buffer.from(email.trim().toLowerCase(), "utf8"));
  return `${payload}.${sign(payload)}`;
}

/** Returns the email a token vouches for, or null when it fails verification. */
export function readAccessToken(token: string | undefined | null): string | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".", 2);
  if (!payload || !sig) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  // Compare in constant time, and only when the lengths already match:
  // timingSafeEqual throws on a length mismatch.
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const email = Buffer.from(payload, "base64url").toString("utf8");
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null;
  } catch {
    return null;
  }
}
