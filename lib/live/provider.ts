import "server-only";
import crypto from "crypto";
import { GRAPH_VERSION, liveCredentials } from "./config";
import type { OutboundMessage } from "./messages";

/**
 * The WhatsApp Cloud API, and the only file that talks to it.
 *
 * Everything above this layer builds plain objects and never knows whether a
 * real send happened, which is what lets the whole bot be tested without Meta
 * credentials existing.
 */

export interface SendResult {
  ok: boolean;
  /** WhatsApp's id for the message, when it was really sent. */
  messageId?: string;
  error?: string;
  /** True when there are no credentials, so nothing was attempted. */
  skipped?: boolean;
}

/**
 * Verifies that a webhook really came from Meta.
 *
 * Compared in constant time, and a missing app secret is treated as a failure
 * rather than a pass: an unverified webhook is an open door for anyone who
 * finds the URL, and TORAN's empty app secret is exactly the mistake worth not
 * repeating here.
 */
export function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET || "";
  if (!secret || !header) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Answers Meta's subscribe handshake, echoing the challenge back. */
export function verifyChallenge(params: URLSearchParams): string | null {
  const creds = liveCredentials();
  const expected = creds?.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN || "";
  if (!expected) return null;
  if (params.get("hub.mode") !== "subscribe") return null;
  if (params.get("hub.verify_token") !== expected) return null;
  return params.get("hub.challenge");
}

/**
 * Sends one message. Never throws: a customer's next step must not depend on
 * our ability to log or retry, and the caller decides what a failure means.
 */
export async function sendMessage(to: string, message: OutboundMessage): Promise<SendResult> {
  const creds = liveCredentials();
  if (!creds) return { ok: false, skipped: true, error: "WhatsApp is not connected yet." };

  const body = { messaging_product: "whatsapp", recipient_type: "individual", to, ...message };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.token}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: json?.error?.message || `WhatsApp returned ${res.status}` };
    }
    return { ok: true, messageId: json?.messages?.[0]?.id };
  } catch (e: any) {
    return { ok: false, error: e?.name === "AbortError" ? "WhatsApp timed out" : e?.message || "Send failed" };
  }
}
