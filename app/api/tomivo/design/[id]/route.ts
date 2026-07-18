import { NextRequest, NextResponse } from "next/server";
import { currentStudent } from "@/lib/academy/auth";
import { getDesign, hasActiveSubscription, incrementCopies } from "@/lib/tomivo/db";

export const dynamic = "force-dynamic";

/**
 * The sole gateway to a design's prompt/HTML/CSS. Free designs are open to
 * everyone; premium designs return the code only to an active subscriber.
 * Previews (preview_html) are public and never pass through here.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const design = await getDesign(params.id);
  if (!design || !design.is_published) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (design.is_premium) {
    const student = await currentStudent();
    const subscribed = student ? await hasActiveSubscription(student.id) : false;
    if (!subscribed) {
      return NextResponse.json({ locked: true, signedIn: !!student }, { status: 403 });
    }
  }

  return NextResponse.json(
    { promptText: design.prompt_text, htmlCode: design.html_code, cssCode: design.css_code },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Records a copy (best-effort analytics). */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await incrementCopies(params.id);
  return NextResponse.json({ ok: true });
}
