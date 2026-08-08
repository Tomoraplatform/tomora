-- =============================================================
-- Tomora Academy: adds the "handwriting to font" course as coming soon.
-- Students see the banner and can leave their email to be notified; the
-- waitlist shows up in the admin Academy panel.
-- =============================================================

insert into public.academy_courses
  (title, slug, short_description, thumbnail_url, price,
   is_published, is_coming_soon, coming_soon_lessons, sort_order)
values (
  'How to Convert Your Handwriting to a Font Using AI',
  'handwriting-to-font-with-ai',
  'Turn your own handwriting into a real font you can type with, install and share anywhere. One lesson, start to finish.',
  'https://www.tomora.com.ng/academy-handwriting-banner.jpg',
  0, true, true, 1, 4
)
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  thumbnail_url = excluded.thumbnail_url,
  is_published = excluded.is_published,
  is_coming_soon = excluded.is_coming_soon,
  coming_soon_lessons = excluded.coming_soon_lessons,
  sort_order = excluded.sort_order;
