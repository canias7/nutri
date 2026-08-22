-- ---------------------------------------------------------------------------
-- Up to five photos on a food entry, not one.
-- ---------------------------------------------------------------------------

-- A plate, the label on the packet, what was left afterwards — one picture per
-- meal was a limit the diary had no reason to impose. Five per entry, and an
-- entry per thing eaten, so a day is not capped at five either.

alter table public.log_meals
  add column photo_paths text[] not null default '{}';

update public.log_meals
set photo_paths = array[photo_path]
where photo_path <> '';

alter table public.log_meals
  drop column photo_path;

comment on column public.log_meals.photo_paths is
  'Object names in the meal-photos bucket, oldest first. The bucket is private; '
  'the app hands out short-lived signed URLs rather than storing public links.';

-- The cap is a rule about the data, not a rule about the form, so it lives here
-- as well as in the browser.
alter table public.log_meals
  add constraint log_meals_photo_count
  check (coalesce(array_length(photo_paths, 1), 0) <= 5);
