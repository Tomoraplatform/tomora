-- =============================================================
-- Tomora Academy: an optional "slashed" price shown beside the real one,
-- so a course can advertise what it is worth against what it costs.
-- Creator courses already had this; Academy's own courses did not.
-- =============================================================

alter table public.academy_courses
  add column if not exists compare_price integer;
