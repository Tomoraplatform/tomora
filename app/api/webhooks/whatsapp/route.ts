import { NextResponse, type NextRequest } from "next/server";
import { verifyChallenge, verifySignature } from "@/lib/live/provider";
import { handleInbound, type Inbound } from "@/lib/live/router";
import { liveData } from "@/lib/live/data";
import { claimInbound, loadConversation, saveConversation, sendReplies } from "@/lib/live/conversations";

/**
 * The WhatsApp webhook: every customer message arrives here.
 *
 * Meta retries anything it does not get a fast 200 for, so this always answers
 * 200 once the signature checks out, even when handling fails. A retry storm
 * against a bug would be worse than a dropped message, and the message is
 * recorded before it is acted on either way.
 */

// Signature verification needs the byte-for-byte body, so this must never be
// pre-parsed or cached.
export const dynamic = "force-dynamic";

/** Meta's subscribe handshake. */
export async function GET(request: NextRequest) {
  const challenge = verifyChallenge(request.nextUrl.searchParams);
  if (!challenge) return new NextResponse("Forbidden", { status: 403 });
  return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  try {
    for (const entry of event?.entry || []) {
      for (const change of entry?.changes || []) {
        const value = change?.value;
        // Delivery and read receipts arrive here too; only messages matter.
        for (const message of value?.messages || []) {
          await handleOne(message, value);
        }
      }
    }
  } catch {
    // Swallowed on purpose: see the note above about retries.
  }

  return NextResponse.json({ received: true });
}

async function handleOne(message: any, value: any) {
  const waId: string = message?.from;
  const messageId: string = message?.id;
  if (!waId || !messageId) return;

  const conversation = await loadConversation(waId);

  // Redelivery of something already handled: stop before it is acted on twice.
  const fresh = await claimInbound(conversation.id, messageId, message);
  if (!fresh) return;

  const input: Inbound = {
    waId,
    profileName: value?.contacts?.[0]?.profile?.name,
    ...readMessage(message),
  };

  const { state, replies } = await handleInbound(input, conversation.state, liveData);
  await saveConversation(conversation.id, state, state.siteId);
  await sendReplies(conversation.id, waId, replies);
}

/** Flattens WhatsApp's message shapes into text and a tapped id. */
function readMessage(message: any): { text?: string; replyId?: string } {
  switch (message?.type) {
    case "text":
      return { text: message.text?.body };
    case "interactive": {
      const i = message.interactive;
      if (i?.type === "button_reply") return { replyId: i.button_reply?.id, text: i.button_reply?.title };
      if (i?.type === "list_reply") return { replyId: i.list_reply?.id, text: i.list_reply?.title };
      return {};
    }
    // A tap on an old-style template button.
    case "button":
      return { text: message.button?.text, replyId: message.button?.payload };
    default:
      // Images, audio, location and the rest: acknowledged, then treated as a
      // nudge back to the menu rather than ignored in silence.
      return {};
  }
}
