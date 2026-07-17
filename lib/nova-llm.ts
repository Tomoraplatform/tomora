import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { novaSystemPrompt, NOVA_CREATE_SITE_TOOL } from "@/lib/nova";

/**
 * Provider-flexible LLM call for Nova. Prefers Claude (ANTHROPIC_API_KEY);
 * falls back to Google Gemini's free tier (GEMINI_API_KEY) so Nova can run
 * at no cost until the Claude key is added. Both paths return the same shape:
 * the assistant's text and, when the model decided to build, the create_site
 * tool input.
 */

export interface NovaTurn {
  text: string;
  toolInput?: Record<string, unknown>;
}

export type NovaMessage = { role: "user" | "assistant"; content: string };

export function novaConfigured(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);
}

export async function runNovaTurn(messages: NovaMessage[]): Promise<NovaTurn> {
  if (process.env.ANTHROPIC_API_KEY) return claudeTurn(messages);
  return geminiTurn(messages);
}

/* ------------------------- Claude (preferred) ------------------------- */

async function claudeTurn(messages: NovaMessage[]): Promise<NovaTurn> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system: novaSystemPrompt(),
    tools: [NOVA_CREATE_SITE_TOOL],
    messages,
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "create_site"
  );
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return { text, toolInput: toolUse ? (toolUse.input as Record<string, unknown>) : undefined };
}

/* --------------------- Gemini free tier (fallback) --------------------- */

// Rolling alias, always the current free-tier Flash model, so it survives
// Google retiring dated versions for new accounts.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

/** Gemini's function-declaration schema: uppercase types, no additionalProperties. */
function toGeminiSchema(schema: any): any {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema && typeof schema === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(schema)) {
      if (k === "additionalProperties") continue;
      if (k === "type" && typeof v === "string") { out.type = v.toUpperCase(); continue; }
      out[k] = toGeminiSchema(v);
    }
    return out;
  }
  return schema;
}

async function geminiTurn(messages: NovaMessage[]): Promise<NovaTurn> {
  const key = process.env.GEMINI_API_KEY!;
  const body = {
    systemInstruction: { parts: [{ text: novaSystemPrompt() }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    tools: [{
      functionDeclarations: [{
        name: NOVA_CREATE_SITE_TOOL.name,
        description: NOVA_CREATE_SITE_TOOL.description,
        parameters: toGeminiSchema(NOVA_CREATE_SITE_TOOL.input_schema),
      }],
    }],
    generationConfig: { maxOutputTokens: 4096 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(50_000),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini request failed (${res.status}).`);
  }

  const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
  const call = parts.find((p) => p.functionCall?.name === NOVA_CREATE_SITE_TOOL.name);
  const text = parts
    .filter((p) => typeof p.text === "string")
    .map((p) => p.text)
    .join("\n")
    .trim();

  return { text, toolInput: call ? (call.functionCall.args as Record<string, unknown>) : undefined };
}
