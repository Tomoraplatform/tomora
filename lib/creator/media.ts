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

export { normalizeLessonLink, toEmbedUrl } from "@/lib/creator/embed";
