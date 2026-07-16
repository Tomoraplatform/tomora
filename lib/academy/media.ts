import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const MEDIA_BUCKET = "academy-media";
const THUMB_BUCKET = "academy-thumbnails";

/**
 * Creates a one-time signed upload URL so the browser can send large media
 * (video/slides) straight to the private bucket without passing through a
 * server action (which caps body size). Admin-guarded by the caller.
 */
export async function createMediaUploadUrl(kind: "video" | "slides", ext: string): Promise<{ path: string; token: string }> {
  const admin = createAdminClient();
  const safeExt = (ext || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 6) || "bin";
  const path = `${kind}/${crypto.randomUUID()}.${safeExt}`;
  const { data, error } = await admin.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message || "Could not start upload.");
  return { path, token: data.token };
}

/** Short-lived signed playback URL for a private media path (in-portal only). */
export async function signedPlaybackUrl(path: string, expiresIn = 60 * 60): Promise<string | null> {
  if (!path) return null;
  const admin = createAdminClient();
  const { data } = await admin.storage.from(MEDIA_BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl || null;
}

/** Signed upload URL for a course thumbnail (public bucket). */
export async function createThumbnailUploadUrl(ext: string): Promise<{ path: string; token: string; publicUrl: string }> {
  const admin = createAdminClient();
  const safeExt = (ext || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 6) || "jpg";
  const path = `${crypto.randomUUID()}.${safeExt}`;
  const { data, error } = await admin.storage.from(THUMB_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message || "Could not start upload.");
  const { data: pub } = admin.storage.from(THUMB_BUCKET).getPublicUrl(path);
  return { path, token: data.token, publicUrl: pub.publicUrl };
}

export { MEDIA_BUCKET, THUMB_BUCKET };
