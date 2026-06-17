import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { updateSetting } from "@/lib/settings";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Admin access denied." },
      { status: 403 },
    );
  }

  try {
    const { settings } = await req.json(); // { key: value, ... }
    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { ok: false, message: "Nothing to update." },
        { status: 400 },
      );
    }
    for (const [key, value] of Object.entries(settings)) {
      await updateSetting(key, String(value ?? ""));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[update-settings]", err);
    return NextResponse.json(
      { ok: false, message: "Could not save settings." },
      { status: 500 },
    );
  }
}
