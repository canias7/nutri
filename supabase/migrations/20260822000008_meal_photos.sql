-- ---------------------------------------------------------------------------
-- An optional photo on a food entry.
-- ---------------------------------------------------------------------------

-- A photograph says more about a portion than "≈250 g" does, and it is the one
-- thing a nutritionist reads a food diary for that words are worst at. Optional
-- throughout: a day with no pictures is still a complete day.

alter table public.log_meals
  add column photo_path text not null default '';

comment on column public.log_meals.photo_path is
  'Object name in the meal-photos bucket, or empty. The bucket is private; the '
  'app hands out short-lived signed URLs rather than storing public links.';

-- Private. A food diary is nobody else''s business, so nothing here is readable
-- without a signed URL the app issues after checking who is asking.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Objects are named `<client uuid>/<random>.<ext>`, so the first path segment
-- is the owner and the same rules the diary tables use apply here: the client
-- writes, the client and their nutritionist read.
--
-- The regexp guard matters. can_access_client takes a uuid, and a name that did
-- not start with one would raise rather than return false — breaking reads of
-- every other object in the bucket along with it.

drop policy if exists meal_photos_read on storage.objects;
create policy meal_photos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'meal-photos'
    and name ~ '^[0-9a-fA-F-]{36}/'
    and private.can_access_client(substring(name from 1 for 36)::uuid)
  );

drop policy if exists meal_photos_insert on storage.objects;
create policy meal_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'meal-photos'
    and name ~ '^[0-9a-fA-F-]{36}/'
    and substring(name from 1 for 36) = auth.uid()::text
  );

drop policy if exists meal_photos_delete on storage.objects;
create policy meal_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'meal-photos'
    and name ~ '^[0-9a-fA-F-]{36}/'
    and substring(name from 1 for 36) = auth.uid()::text
  );
