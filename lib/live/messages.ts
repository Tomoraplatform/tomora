import { LIMITS } from "./config";

/**
 * Outbound WhatsApp message shapes.
 *
 * Pure builders, no network and no database. WhatsApp rejects a message whose
 * title is one character too long, so every limit is clamped here rather than
 * trusted from the caller: a seller with a long product name should not be able
 * to break their own store.
 */

export type OutboundMessage =
  | { type: "text"; text: { body: string; preview_url?: boolean } }
  | { type: "interactive"; interactive: Record<string, unknown> };

/** Cuts to a limit without leaving a dangling word where it can be helped. */
export function clamp(value: string, max: number): string {
  const s = (value || "").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd() + "…";
}

export function text(body: string, previewUrl = false): OutboundMessage {
  return { type: "text", text: { body: clamp(body, 4096), preview_url: previewUrl } };
}

export interface Button {
  id: string;
  title: string;
}

/** Up to three reply buttons. WhatsApp silently drops any beyond that. */
export function buttons(body: string, list: Button[], header?: string): OutboundMessage {
  return {
    type: "interactive",
    interactive: {
      type: "button",
      ...(header ? { header: { type: "text", text: clamp(header, 60) } } : {}),
      body: { text: clamp(body, LIMITS.body) },
      action: {
        buttons: list.slice(0, LIMITS.buttons).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: clamp(b.title, LIMITS.buttonTitle) },
        })),
      },
    },
  };
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

/**
 * A single-section list. Ten rows is WhatsApp's ceiling, which is why the
 * catalogue pages rather than dumping every product.
 */
export function list(
  body: string,
  buttonLabel: string,
  rows: ListRow[],
  opts?: { header?: string; footer?: string; sectionTitle?: string }
): OutboundMessage {
  return {
    type: "interactive",
    interactive: {
      type: "list",
      ...(opts?.header ? { header: { type: "text", text: clamp(opts.header, 60) } } : {}),
      body: { text: clamp(body, LIMITS.body) },
      ...(opts?.footer ? { footer: { text: clamp(opts.footer, 60) } } : {}),
      action: {
        button: clamp(buttonLabel, LIMITS.buttonTitle),
        sections: [{
          title: clamp(opts?.sectionTitle || "Options", 24),
          rows: rows.slice(0, LIMITS.listRows).map((r) => ({
            id: r.id,
            title: clamp(r.title, LIMITS.rowTitle),
            ...(r.description ? { description: clamp(r.description, LIMITS.rowDescription) } : {}),
          })),
        }],
      },
    },
  };
}

/**
 * A call-to-action URL button, used for the payment link.
 *
 * Sent as a button rather than a bare link so the customer taps once and comes
 * straight back to the chat afterwards.
 */
export function linkButton(body: string, url: string, label: string): OutboundMessage {
  return {
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: { text: clamp(body, LIMITS.body) },
      action: { name: "cta_url", parameters: { display_text: clamp(label, LIMITS.buttonTitle), url } },
    },
  };
}
