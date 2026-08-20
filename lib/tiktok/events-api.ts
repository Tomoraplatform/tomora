import "server-only";
import crypto from "crypto";
import { TIKTOK_PIXEL_ID } from "./config";

/**
 * TikTok Events API: the server's copy of an event.
 *
 * Browser pixels lose events constantly here, to blockers, in-app browsers and
 * flaky mobile connections, and a payment is confirmed by Paystack's webhook
 * rather than by a browser reaching a thank-you page. So the moments that
 * matter are sent from the server, where they are certain.
 *
 * When both sides send the same action they carry the same `eventId`, which is
 * how TikTok is told they are one event and not two.
 *
 * Nothing identifying leaves this file in the clear: TikTok requires email and
 * phone to be SHA-256 hashed, and doing it here means the raw values never
 * reach the network.
 */

const ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

/** TikTok wants lowercase, trimmed, then SHA-256 hex. */
function hash(value?: string | null): string | undefined {
  const v = (value || "").trim().toLowerCase();
  if (!v) return undefined;
  return crypto.createHash("sha256").update(v).digest("hex");
}

/** Phones must be E.164 before hashing, or the match silently fails. */
function hashPhone(raw?: string | null): string | undefined {
  const digits = (raw || "").replace(/[^\d+]/g, "");
  if (!digits) return undefined;
  let e164 = digits;
  if (e164.startsWith("0")) e164 = `+234${e164.slice(1)}`;      // local Nigerian
  else if (!e164.startsWith("+")) e164 = `+${e164}`;
  return hash(e164);
}

export interface TikTokEventInput {
  /** A TikTok standard event name, e.g. CompleteRegistration. */
  event: string;
  /** Shared with the browser's copy of the same action, for deduplication. */
  eventId: string;
  email?: string | null;
  phone?: string | null;
  /** The page the action happened on. */
  url?: string;
  ip?: string;
  userAgent?: string;
  value?: number;
  currency?: string;
  contents?: { content_id: string; content_name?: string; price?: number; quantity?: number }[];
}

/**
 * Sends one event. Never throws and never blocks the caller's work: analytics
 * failing must not fail a signup or a payment.
 */
export async function sendTikTokEvent(input: TikTokEventInput): Promise<boolean> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) return false; // not configured yet: stay silent rather than error

  const user: Record<string, string> = {};
  const email = hash(input.email);
  const phone = hashPhone(input.phone);
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (input.ip) user.ip = input.ip;
  if (input.userAgent) user.user_agent = input.userAgent;

  const properties: Record<string, unknown> = {};
  if (input.value != null) properties.value = input.value;
  if (input.currency) properties.currency = input.currency;
  if (input.contents?.length) properties.contents = input.contents;

  const body = {
    event_source: "web",
    event_source_id: TIKTOK_PIXEL_ID,
    // Set while verifying the setup in TikTok's Events Manager, unset in normal use.
    ...(process.env.TIKTOK_TEST_EVENT_CODE ? { test_event_code: process.env.TIKTOK_TEST_EVENT_CODE } : {}),
    data: [{
      event: input.event,
      event_time: Math.floor(Date.now() / 1000),
      event_id: input.eventId,
      user,
      page: input.url ? { url: input.url } : undefined,
      properties,
    }],
  };

  try {
    // A slow analytics call must not hold up a payment webhook.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": token },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const json = await res.json().catch(() => null);
    // TikTok answers 200 with a non-zero code when it rejects the payload.
    return !json || json.code === 0;
  } catch {
    return false;
  }
}
