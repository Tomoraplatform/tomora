import { NextResponse, type NextRequest } from "next/server";
import { getResource, hasPurchased, bumpCounter } from "@/lib/resources/db";
import { ACCESS_COOKIE, readAccessToken } from "@/lib/resources/access";

/**
 * Serves the prompt and the HTML for one resource. This is the only route that
 * hands them out, and it refuses unless the resource is free or the caller's
 * signed cookie belongs to someone who paid for it.
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const resource = await getResource(params.slug);
  if (!resource || !resource.is_published) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (resource.is_paid) {
    const email = readAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
    if (!email || !(await hasPurchased(resource.id, email))) {
      return NextResponse.json({ error: "This resource has not been unlocked." }, { status: 402 });
    }
  }

  const what = request.nextUrl.searchParams.get("copy");
  if (what === "prompt" || what === "html") await bumpCounter(resource.id, "copies");

  return NextResponse.json({
    ok: true,
    title: resource.title,
    prompt: resource.prompt_text,
    html: resource.html_code,
  });
}
