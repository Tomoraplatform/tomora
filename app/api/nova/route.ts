import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSiteFromNova, type NovaSpec } from "@/lib/nova";
import { runNovaTurn, novaConfigured, type NovaMessage } from "@/lib/nova-llm";
import { novaEnabled } from "@/lib/nova-flag";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_MESSAGES = 40;
const MAX_CHARS = 2000;
const MAX_IMAGES_PER_MESSAGE = 10;

/** Only pass through image URLs that live in our own Supabase storage. */
function storageUrls(images: unknown): string[] {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || !Array.isArray(images)) return [];
  return images
    .filter((u): u is string => typeof u === "string" && u.startsWith(`${base}/storage/`))
    .slice(0, MAX_IMAGES_PER_MESSAGE);
}

/**
 * Nova chat turn. Body: { messages: [{ role: "user"|"assistant", content: string }] }.
 * Returns { message } for the next question, or { done, message, liveUrl, subdomain }
 * once Nova has created and published the site.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  if (!(await novaEnabled()) || !novaConfigured()) {
    return NextResponse.json({ error: "Nova isn't available right now. Please try again later." }, { status: 503 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const history = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  const messages: NovaMessage[] = history
    .filter((m: any) =>
      (m?.role === "user" || m?.role === "assistant") &&
      ((typeof m?.content === "string" && m.content.trim()) || storageUrls(m?.images).length)
    )
    .map((m: any) => {
      let content = String(m.content || "").slice(0, MAX_CHARS);
      // Attached images travel as URLs inside the text so any model can read them.
      const imgs = m.role === "user" ? storageUrls(m.images) : [];
      if (imgs.length) content = `${content}\n\n[Attached images: ${imgs.join(" , ")}]`.trim();
      return { role: m.role, content };
    });
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Say something to get started." }, { status: 400 });
  }

  let turn;
  try {
    turn = await runNovaTurn(messages);
  } catch {
    return NextResponse.json({ error: "Nova is busy right now, please try again in a moment." }, { status: 502 });
  }

  if (turn.toolInput) {
    const result = await createSiteFromNova(turn.toolInput as unknown as NovaSpec);
    if (!result.ok) {
      return NextResponse.json({
        message: `I hit a snag creating your site: ${result.error} Let's try again, could you confirm your business name?`,
      });
    }
    return NextResponse.json({
      done: true,
      liveUrl: result.liveUrl,
      subdomain: result.subdomain,
      siteId: result.siteId,
      message:
        turn.text ||
        "Your website is live! I've set up your template, written your content and published it. You can open your live site below, and use the editor any time to change images, your logo, colours or any text.",
    });
  }

  if (!turn.text) {
    return NextResponse.json({ message: "Could you tell me a bit more about your business?" });
  }
  return NextResponse.json({ message: turn.text });
}
