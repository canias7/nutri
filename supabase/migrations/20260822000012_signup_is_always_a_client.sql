-- ---------------------------------------------------------------------------
-- Signing up makes you a client. There is no other kind of sign-up.
-- ---------------------------------------------------------------------------

-- handle_new_user read the role out of raw_user_meta_data and, for
-- 'nutritionist', created the account that can read every client's diary. The
-- sign-up Server Action always sends 'client', but that is not where the check
-- belongs: raw_user_meta_data is whatever the browser put in `options.data`,
-- the publishable key is in the page, and /auth/v1/signup is public. So
--
--   supabase.auth.signUp({ email, password,
--     options: { data: { role: 'nutritionist' } } })
--
-- was enough to become a nutritionist — and because the_nutritionist() is
-- oldest-wins, the first person to do it while no nutritionist exists becomes
-- the nutritionist for everybody.
--
-- Proven against this database before the fix: the row appeared in
-- public.nutritionists and the_nutritionist() returned it.
--
-- The requested role is now ignored rather than filtered. A filter is a list of
-- the roles someone thought of; this has no list.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, email, language)
  values (
    new.id,
    'client',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'language', ''), 'en')
  );

  -- Null until a nutritionist exists, which make_nutritionist() backfills.
  insert into public.clients (profile_id, nutritionist_id)
  values (new.id, private.the_nutritionist());

  return new;
end;
$$;

comment on function private.handle_new_user() is
  'Builds the profile and client row for a new account. The role is not read '
  'from user metadata: sign-up is a client-only door, and a nutritionist is '
  'made deliberately with private.make_nutritionist().';

-- The way a nutritionist is made now that sign-up cannot make one. It lives in
-- `private` so PostgREST does not publish it, and is SECURITY DEFINER so it can
-- step around the two guard triggers — which exist precisely to stop a signed-in
-- user doing this to themselves.
create or replace function private.make_nutritionist(user_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  logged int;
begin
  select id into uid from public.profiles where email = user_email;
  if uid is null then
    raise exception 'No account for %. They have to sign up first.', user_email;
  end if;

  -- Promoting someone drops their client row, and that cascades their diary.
  -- Refuse rather than delete somebody's records as a side effect.
  select count(*) into logged from public.daily_logs where client_id = uid;
  if logged > 0 then
    raise exception
      '% has % logged day(s). Promoting would delete them — use a fresh account.',
      user_email, logged;
  end if;

  alter table public.profiles disable trigger profiles_guard_columns;
  update public.profiles set role = 'nutritionist' where id = uid;
  alter table public.profiles enable trigger profiles_guard_columns;

  delete from public.clients where profile_id = uid;
  insert into public.nutritionists (profile_id) values (uid)
    on conflict (profile_id) do nothing;

  -- Everyone who signed up while there was nobody to attach them to.
  alter table public.clients disable trigger clients_guard_columns;
  update public.clients set nutritionist_id = uid where nutritionist_id is null;
  alter table public.clients enable trigger clients_guard_columns;

  return uid;
end;
$$;

comment on function private.make_nutritionist(text) is
  'Turns an existing account into the practice''s nutritionist and attaches '
  'every unattached client to them. Run from the SQL editor: '
  'select private.make_nutritionist(''them@example.com'');';

revoke all on function private.make_nutritionist(text) from public, anon, authenticated;
