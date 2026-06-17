-- ════════════════════════════════════════════════════════════════════
-- Seed: course content placeholders + default app settings
-- Safe to re-run (uses stable keys / on conflict).
-- Admin can edit everything below from /admin/dashboard.
-- ════════════════════════════════════════════════════════════════════

-- Placeholder Bunny Stream embed (replace LIBRARY_ID / VIDEO_ID in admin):
-- https://iframe.mediadelivery.net/embed/LIBRARY_ID/VIDEO_ID

-- ───────────────────────── app_settings ─────────────────────
insert into public.app_settings (setting_key, setting_value) values
  ('whatsapp_community_link', '#'),
  ('feedback_recipient_email', 'tommyconcept4@gmail.com'),
  ('course_price', '9999'),
  ('currency', 'NGN'),
  ('support_email', 'support@yourdomain.com')
on conflict (setting_key) do nothing;

-- ─────────────────── modules + lessons (idempotent) ─────────
do $$
declare
  m0 uuid; m1 uuid; m2 uuid; m3 uuid; m4 uuid; m5 uuid;
  vid text := 'https://iframe.mediadelivery.net/embed/LIBRARY_ID/VIDEO_ID';
  pdf text := '/worksheets/placeholder-worksheet.pdf';
begin
  if exists (select 1 from public.modules) then
    return; -- already seeded
  end if;

  -- Welcome / Start Here (module_order 0)
  insert into public.modules (title, description, module_order)
    values ('Welcome / Start Here', 'Get oriented before you begin.', 0)
    returning id into m0;
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, video_embed_url)
    values (m0, 'How to Use This Course', 'A quick orientation to get the most out of this program.', 1, 'welcome', vid);

  -- Module 1
  insert into public.modules (title, description, module_order)
    values ('Set Your Foundation', 'Understand the opportunity and design your brand blueprint.', 1)
    returning id into m1;
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, video_embed_url) values
    (m1, 'Understanding the Extra Income Opportunity', 'Where the real opportunity is and how to position yourself.', 1, 'video', vid);
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, pdf_view_url) values
    (m1, 'Your Brand Presence Blueprint', 'Worksheet: map out your brand presence blueprint.', 2, 'worksheet', pdf);

  -- Module 2
  insert into public.modules (title, description, module_order)
    values ('Build Your Online Presence', 'Create a clean brand structure and set up your digital home.', 2)
    returning id into m2;
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, video_embed_url) values
    (m2, 'Creating a Clean Brand Structure', 'How to structure a clean, trustworthy brand presence.', 1, 'video', vid);
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, pdf_view_url) values
    (m2, 'Setting Up Your Digital Home', 'Worksheet: plan and set up your digital home.', 2, 'worksheet', pdf);

  -- Module 3
  insert into public.modules (title, description, module_order)
    values ('Use Claude AI to Create Faster', 'Think with Claude and create content and brand assets faster.', 3)
    returning id into m3;
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, video_embed_url) values
    (m3, 'How to Think with Claude', 'A practical framework for thinking and creating with Claude.', 1, 'video', vid);
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, pdf_view_url) values
    (m3, 'Creating Content and Brand Assets with Claude', 'Worksheet: prompts and asset checklist.', 2, 'worksheet', pdf);

  -- Module 4
  insert into public.modules (title, description, module_order)
    values ('Monetize Your Presence', 'Turn your skill or knowledge into a simple offer and monetization path.', 4)
    returning id into m4;
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, video_embed_url) values
    (m4, 'Turning Your Skill or Knowledge into an Offer', 'Package what you know into something people will pay for.', 1, 'video', vid);
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, pdf_view_url) values
    (m4, 'Creating a Simple Monetization Path', 'Worksheet: design your monetization path.', 2, 'worksheet', pdf);

  -- Module 5
  insert into public.modules (title, description, module_order)
    values ('Launch and Improve', 'Share your brand online and improve with feedback and consistency.', 5)
    returning id into m5;
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, video_embed_url) values
    (m5, 'Sharing Your Brand Online', 'How to launch and share your brand with confidence.', 1, 'video', vid);
  insert into public.lessons (module_id, title, description, lesson_order, lesson_type, pdf_view_url) values
    (m5, 'Improving with Feedback and Consistency', 'Worksheet: your consistency and improvement plan.', 2, 'worksheet', pdf);
end $$;
