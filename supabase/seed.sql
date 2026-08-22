-- Development seed: accounts you can actually sign in with.
--
--   Client       alex@nutritest.app  / Passw0rd123
--   Client       solo@nutritest.app  / Passw0rd123   (no nutritionist attached)
--   Nutritionist dana@nutritest.app  / Passw0rd123
--
-- Run against a development project only — never the production project. It
-- deletes the accounts it is about to create, and a nutritionist seeded here is
-- the one the_nutritionist() hands every client to:
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Why not just call the sign-up API? Two reasons. Supabase validates that the
-- email domain can actually receive mail, and its built-in mailer is rate
-- limited to a couple of messages an hour — neither is workable for seeding.
--
-- Two details bite anyone hand-writing these rows:
--
--   1. Password sign-in resolves the account through auth.identities. A user
--      without an identity row exists but can never log in.
--   2. The token columns must be '' and not NULL. Supabase's auth service reads
--      them into plain strings, and a NULL fails that read — which surfaces as
--      "Database error querying schema" on every sign-in attempt, an error that
--      says nothing about the actual cause.

create or replace function pg_temp.seed_user(
  email text,
  password text,
  full_name text
) returns uuid
language plpgsql
as $$
declare
  user_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    user_id, 'authenticated', 'authenticated', email,
    extensions.crypt(password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', full_name),
    '', '', '', '', '', '', '', ''
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
where email in ('alex@nutritest.app', 'dana@nutritest.app', 'solo@nutritest.app');

-- Every sign-up is a client now, including these: handle_new_user ignores the
-- role in user metadata, because that field is whatever the browser sent.
select pg_temp.seed_user('alex@nutritest.app', 'Passw0rd123', 'Alex Morgan');
select pg_temp.seed_user('dana@nutritest.app', 'Passw0rd123', 'Dana Reed');
-- A client with no nutritionist. Most of the app behaves differently for one —
-- messages, the discussion, the dashboard's coach panel — and a fixture is the
-- only way to exercise those without unpicking Alex's link.
select pg_temp.seed_user('solo@nutritest.app', 'Passw0rd123', 'Sol Rivera');

-- The one supported way to make a nutritionist. It also attaches every client
-- who signed up while there was nobody to attach them to — which is all of them,
-- so Sol is detached again below.
select private.make_nutritionist('dana@nutritest.app');

-- The guard trigger reverts these columns for anyone who is not the owner, which
-- is the point of it — the seed is the one place allowed to step around it.
alter table public.clients disable trigger clients_guard_columns;

update public.clients c
set goal = 'Sleep better and stop snacking at night',
    onboarding_completed_at = now(),
    -- Sign-up attaches everyone to the one nutritionist, so being unattached is
    -- now a state the seed has to create on purpose rather than one it inherits.
    nutritionist_id = null
from public.profiles p
where p.id = c.profile_id
  and p.email = 'solo@nutritest.app';

alter table public.clients enable trigger clients_guard_columns;

commit;

select p.email, p.role, p.full_name,
       (select count(*) from public.clients c where c.nutritionist_id = p.id) as clients
from public.profiles p
order by p.role, p.email;
