import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { novaSystemPrompt, NOVA_CREATE_SITE_TOOL, createSiteFromNova, type NovaSpec } from "@/lib/nova";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MESSAGES = 40;
const MAX_CHARS = 2000;

/**
 * Nova chat turn. Body: { messages: [{ role: "user"|"assistant", content: string }] }.
 * Returns { message } for the next question, or { done, message, liveUrl, subdomain }
 * once Nova has created and published the site.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Nova isn't configured yet. Please try again later." }, { status: 503 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const history = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  const messages: Anthropic.MessageParam[] = history
    .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string" && m.content.trim())
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, MAX_CHARS) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Say something to get started." }, { status: 400 });
  }

  const client = new Anthropic();

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: novaSystemPrompt(),
      tools: [NOVA_CREATE_SITE_TOOL],
      messages,
    });
  } catch (e: any) {
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: "Nova is busy right now — please try again in a moment." }, { status: 502 });
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 502 });
  }

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "create_site"
  );
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (toolUse) {
    const result = await createSiteFromNova(toolUse.input as NovaSpec);
    if (!result.ok) {
      return NextResponse.json({
        message: `I hit a snag creating your site: ${result.error} Let's try again — could you confirm your business name?`,
      });
    }
    return NextResponse.json({
      done: true,
      liveUrl: result.liveUrl,
      subdomain: result.subdomain,
      siteId: result.siteId,
      message:
        text ||
        "Your website is live! I've set up your template, written your content and published it. You can open your live site below, and use the editor any time to change images, your logo, colours or any text.",
    });
  }

  if (!text) {
    return NextResponse.json({ message: "Could you tell me a bit more about your business?" });
  }
  return NextResponse.json({ message: text });
}
