import { createClient } from "@/lib/supabase/client";

/**
 * Downscale + compress a photo in the browser before uploading. Phone photos are
 * often 3 to 8MB; this brings them to a few hundred KB, so uploads (and the whole
 * onboarding flow) are far faster on mobile data. Falls back to the original on
 * any failure or for non-photo types (gif/svg/video).
 */
async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size < 400 * 1024) return file; // already small
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Uploads an image to a Supabase storage bucket and returns its public URL.
 * Buckets: "branding" (logos) or "products".
 */
export async function uploadImage(
  file: File,
  bucket: "branding" | "products"
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Product photos don't need full hero resolution, compress harder for speed.
  const compressed = bucket === "products"
    ? await compressImage(file, 1200, 0.78)
    : await compressImage(file, 1600, 0.85);
  const ext = compressed.name.split(".").pop() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, compressed, { cacheControl: "3600", upsert: false });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * Uploads any media file (image or video) with a size cap. Videos for custom
 * sections are limited to 10MB.
 */
export async function uploadMedia(
  file: File,
  bucket: "branding" | "products" = "branding",
  maxBytes = 10 * 1024 * 1024
): Promise<{ url?: string; error?: string }> {
  const toUpload = await compressImage(file);
  if (toUpload.size > maxBytes) {
    return { error: `File is too large. Maximum is ${Math.round(maxBytes / 1024 / 1024)}MB.` };
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const ext = toUpload.name.split(".").pop() || "bin";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, toUpload, { cacheControl: "3600", upsert: false });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}
