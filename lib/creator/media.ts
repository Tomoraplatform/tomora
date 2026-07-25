import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const PRIVATE_BUCKET = "creator-media";
const PUBLIC_BUCKET = "creator-public";

/** Hard cap on directly uploaded lesson video (per spec: real video goes in as a link). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Signed upload URL for private lesson media (video/pdf). The browser PUTs
 * straight to storage, so large files never pass through the server.
 */
export async function createLessonUploadUrl(kind: "video" | "pdf", ext: string): Promise<{ path: string; token: string }> {
  const admin = createAdminClient();
  const safeExt = (ext || (kind === "pdf" ? "pdf" : "mp4")).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  const path = `${kind}/${crypto.randomUUID()}.${safeExt}`;
  const { data, error } = await admin.storage.from(PRIVATE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message || "Could not start upload.");
  return { path, token: data.token };
}

/** Short-lived playback URL for a private lesson file. */
export async function signedLessonUrl(path: string, expiresIn = 60 * 60): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(PRIVATE_BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl || null;
}

/** Signed upload URL for public images (banner, logo, author photo). */
export async function createPublicUploadUrl(kind: "banner" | "logo" | "author" | "section", ext: string): Promise<{ path: string; token: string; publicUrl: string }> {
  const admin = createAdminClient();
  const safeExt = (ext || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  const path = `${kind}/${crypto.randomUUID()}.${safeExt}`;
  const { data, error } = await admin.storage.from(PUBLIC_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message || "Could not start upload.");
  const { data: pub } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return { path, token: data.token, publicUrl: pub.publicUrl };
}

/**
 * Accepts only YouTube / Vimeo / Google Drive links for `link` lessons, so
 * creators can't point lessons at arbitrary hosts.
 */
export function normalizeLessonLink(raw: string): { ok: boolean; url?: string; error?: string } {
  const value = (raw || "").trim();
  if (!value) return { ok: false, error: "Paste the video link." };
  let u: URL;
  try { u = new URL(value.startsWith("http") ? value : `https://${value}`); }
  catch { return { ok: false, error: "That doesn't look like a valid link." }; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const allowed = ["youtube.com", "youtu.be", "vimeo.com", "player.vimeo.com", "drive.google.com", "docs.google.com"];
  if (!allowed.some((h) => host === h || host.endsWith(`.${h}`))) {
    return { ok: false, error: "Use a YouTube, Vimeo or Google Drive link." };
  }
  return { ok: true, url: u.toString() };
}

/** Turns a watch link into an embeddable player URL for the in-portal player. */
export function toEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return u.toString();
      return null;
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host.endsWith("drive.google.com")) {
      const m = u.pathname.match(/\/d\/([^/]+)/);
      return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
    }
    return null;
  } catch { return null; }
}
