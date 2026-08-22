-- Development seed: two accounts you can actually sign in with.
--
--   Client       alex@nutritest.app  / Passw0rd123
--   Nutritionist dana@nutritest.app  / Passw0rd123   (invite code: dana_coach)
--
-- Run against a development project only:
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Why not just call the sign-up API? Two reasons. Supabase validates that the
-- email domain can actually receive mail, and its built-in mailer is rate
-- limited to a couple of messages an hour — neither is workable for seeding.
--
-- Inserting into auth.users alone is not enough: password sign-in resolves the
-- account through auth.identities, so a user without an identity row exists but
-- can never log in. That row is the part that is easy to miss.

create or replace function pg_temp.seed_user(
  email text,
  password text,
  full_name text,
  role text
) returns uuid
language plpgsql
as $$
declare
  user_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values (
    '00000000-0000-0000-0000-000000000000',
    user_id, 'authenticated', 'authenticated', email,
    extensions.crypt(password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', full_name, 'role', role)
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    user_id::text, user_id,
    jsonb_build_object('sub', user_id::text, 'email', email, 'email_verified', true),
    'email', now(), now(), now()
  );

  return user_id;
end;
$$;

begin;

delete from auth.users
where email in ('alex@nutritest.app', 'dana@nutritest.app');

select pg_temp.seed_user('alex@nutritest.app', 'Passw0rd123', 'Alex Morgan', 'client');
select pg_temp.seed_user('dana@nutritest.app', 'Passw0rd123', 'Dana Reed', 'nutritionist');

update public.nutritionists n
set invite_code = 'dana_coach'
from public.profiles p
where p.id = n.profile_id
  and p.email = 'dana@nutritest.app';

commit;

select p.email, p.role, p.full_name, n.invite_code
from public.profiles p
left join public.nutritionists n on n.profile_id = p.id
order by p.role;
