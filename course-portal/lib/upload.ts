import { createClient } from "@/lib/supabase/client";

const BUCKET = "course-media";

/**
 * Uploads a file directly from the browser to Supabase Storage (bypassing the
 * serverless body-size limit) and returns its public URL. The bucket's RLS
 * only allows admins to write (see 0003_storage.sql).
 */
export async function uploadCourseMedia(
  file: File,
  kind: "video" | "worksheet",
  lessonId: string,
): Promise<string> {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${kind}/${lessonId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
