import { createClient } from "@/lib/supabase/client";

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

  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });
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
  if (file.size > maxBytes) {
    return { error: `File is too large. Maximum is ${Math.round(maxBytes / 1024 / 1024)}MB.` };
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const ext = file.name.split(".").pop() || "bin";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}
