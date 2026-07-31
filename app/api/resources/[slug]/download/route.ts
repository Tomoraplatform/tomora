import { NextResponse, type NextRequest } from "next/server";
import { getResource, hasPurchased, bumpCounter } from "@/lib/resources/db";
import { ACCESS_COOKIE, readAccessToken } from "@/lib/resources/access";

/** Downloads the resource as an .html file, behind the same entitlement check. */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const resource = await getResource(params.slug);
  if (!resource || !resource.is_published) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (resource.is_paid) {
    const email = readAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
    if (!email || !(await hasPurchased(resource.id, email))) {
      return new NextResponse("This resource has not been unlocked.", { status: 402 });
    }
  }

  await bumpCounter(resource.id, "downloads");

  return new NextResponse(resource.html_code, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${resource.slug}.html"`,
      "Cache-Control": "no-store",
    },
  });
}
