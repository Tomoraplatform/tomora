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
