"use client";

import { createClient } from "@/lib/supabase/client";
import { getPublicUploadUrl, getLessonUploadUrl } from "@/app/academy/sell/actions";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Uploads a public image (banner/logo/author/section) and returns its URL. */
export async function uploadCreatorImage(
  file: File,
  kind: "banner" | "logo" | "author" | "section",
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) return { error: "Choose an image file." };
  const meta = await getPublicUploadUrl(kind, file.name.split(".").pop() || "jpg");
  if (!meta.ok || !meta.path || !meta.token) return { error: meta.error || "Could not start upload." };
  const { error } = await createClient().storage.from("creator-public").uploadToSignedUrl(meta.path, meta.token, file);
  if (error) return { error: error.message };
  return { url: meta.publicUrl };
}

/** Uploads private lesson media (small video or PDF) and returns its storage path. */
export async function uploadLessonFile(
  file: File,
  kind: "video" | "pdf",
): Promise<{ path?: string; error?: string }> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      error: kind === "video"
        ? "Video uploads are capped at 10MB. For full lessons paste a YouTube, Vimeo or Drive link instead."
        : "PDF uploads are capped at 10MB.",
    };
  }
  const meta = await getLessonUploadUrl(kind, file.name.split(".").pop() || (kind === "pdf" ? "pdf" : "mp4"));
  if (!meta.ok || !meta.path || !meta.token) return { error: meta.error || "Could not start upload." };
  const { error } = await createClient().storage.from("creator-media").uploadToSignedUrl(meta.path, meta.token, file);
  if (error) return { error: error.message };
  return { path: meta.path };
}
