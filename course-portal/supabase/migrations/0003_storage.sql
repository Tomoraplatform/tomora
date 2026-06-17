-- ════════════════════════════════════════════════════════════════════
-- Storage: direct video + worksheet uploads from the admin dashboard
-- Run this in the Supabase SQL editor (after 0001_schema.sql).
-- ════════════════════════════════════════════════════════════════════

-- Public bucket so lesson videos/worksheets can stream to enrolled students.
-- file_size_limit is in bytes (here ~1GB). You may also need to raise the
-- project-wide upload limit in: Storage → Settings → "Upload file size limit".
insert into storage.buckets (id, name, public, file_size_limit)
values ('course-media', 'course-media', true, 1073741824)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- Anyone may read (so videos/worksheets load in the course pages).
drop policy if exists "course_media_public_read" on storage.objects;
create policy "course_media_public_read" on storage.objects
  for select
  using (bucket_id = 'course-media');

-- Only admins may upload / replace / remove files.
drop policy if exists "course_media_admin_insert" on storage.objects;
create policy "course_media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'course-media' and public.is_admin());

drop policy if exists "course_media_admin_update" on storage.objects;
create policy "course_media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'course-media' and public.is_admin())
  with check (bucket_id = 'course-media' and public.is_admin());

drop policy if exists "course_media_admin_delete" on storage.objects;
create policy "course_media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'course-media' and public.is_admin());
