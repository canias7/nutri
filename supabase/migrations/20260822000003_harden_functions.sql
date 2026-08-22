-- Hardens the database functions against two problems the Supabase linter found.
--
-- 1. Every function in `public` is published by PostgREST as an RPC endpoint, so
--    the RLS helpers were callable as /rest/v1/rpc/is_coach_of and friends. They
--    are internal, so they move to a `private` schema, which PostgREST does not
--    expose. Policies can still call them: the role keeps USAGE and EXECUTE.
--
-- 2. Functions without a fixed `search_path` resolve unqualified names against
--    whatever the caller's search_path happens to be. Everything below pins it
--    to '' and qualifies every name explicitly.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function private.is_coach_of(client uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clients c
    where c.profile_id = client
      and c.nutritionist_id = auth.uid()
  );
$$;

create or replace function private.can_access_client(client uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() = client or private.is_coach_of(client);
$$;

create or replace function private.can_access_log(log uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.daily_logs dl
    where dl.id = log
      and private.can_access_client(dl.client_id)
  );
$$;

create or replace function private.owns_log(log uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.daily_logs dl
    where dl.id = log
      and dl.client_id = auth.uid()
  );
$$;

-- Policies are evaluated with the querying role's privileges, so `authenticated`
-- needs EXECUTE on anything a policy calls.
grant execute on function private.is_coach_of(uuid) to authenticated;
grant execute on function private.can_access_client(uuid) to authenticated;
grant execute on function private.can_access_log(uuid) to authenticated;
grant execute on function private.owns_log(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Trigger functions
-- ---------------------------------------------------------------------------

-- Postgres does not check EXECUTE on a trigger function against the user running
-- the statement, so these need no grants at all once they leave `public`.

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.guard_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.role := old.role;
  new.id := old.id;
  return new;
end;
$$;

create or replace function private.guard_client_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is distinct from old.profile_id then
    new.profile_id := old.profile_id;
    new.nutritionist_id := old.nutritionist_id;
    new.age := old.age;
    new.gender := old.gender;
    new.height_cm := old.height_cm;
    new.start_weight_kg := old.start_weight_kg;
    new.goal := old.goal;
    new.goal_deadline := old.goal_deadline;
    new.initial_complaints := old.initial_complaints;
    new.onboarding_completed_at := old.onboarding_completed_at;
  else
    new.nutritionist_id := old.nutritionist_id;
  end if;

  return new;
end;
$$;

create or replace function private.recalculate_water_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_log uuid := coalesce(new.daily_log_id, old.daily_log_id);
begin
  update public.daily_logs
  set water_total_ml = coalesce(
    (
      select sum(volume_ml)
      from public.log_drinks
      where daily_log_id = target_log
        and counts_as_water
    ),
    0
  )
  where id = target_log;

  return null;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.user_role;
begin
  begin
    requested_role := coalesce(
      (new.raw_user_meta_data ->> 'role')::public.user_role,
      'client'
    );
  exception
    when invalid_text_representation then
      requested_role := 'client';
  end;

  if requested_role = 'admin' then
    requested_role := 'client';
  end if;

  insert into public.profiles (id, role, full_name, email, language)
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'language', ''), 'en')
  );

  if requested_role = 'nutritionist' then
    insert into public.nutritionists (profile_id) values (new.id);
  else
    insert into public.clients (profile_id) values (new.id);
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Repoint triggers
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
drop trigger if exists nutritionists_set_updated_at on public.nutritionists;
drop trigger if exists clients_set_updated_at on public.clients;
drop trigger if exists supplements_set_updated_at on public.supplements;
drop trigger if exists daily_logs_set_updated_at on public.daily_logs;
drop trigger if exists log_meals_set_updated_at on public.log_meals;
drop trigger if exists body_measurements_set_updated_at on public.body_measurements;
drop trigger if exists profiles_guard_columns on public.profiles;
drop trigger if exists clients_guard_columns on public.clients;
drop trigger if exists log_drinks_recalculate_water on public.log_drinks;
drop trigger if exists on_auth_user_created on auth.users;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger nutritionists_set_updated_at before update on public.nutritionists
  for each row execute function private.set_updated_at();
create trigger clients_set_updated_at before update on public.clients
  for each row execute function private.set_updated_at();
create trigger supplements_set_updated_at before update on public.supplements
  for each row execute function private.set_updated_at();
create trigger daily_logs_set_updated_at before update on public.daily_logs
  for each row execute function private.set_updated_at();
create trigger log_meals_set_updated_at before update on public.log_meals
  for each row execute function private.set_updated_at();
create trigger body_measurements_set_updated_at before update on public.body_measurements
  for each row execute function private.set_updated_at();

create trigger profiles_guard_columns before update on public.profiles
  for each row execute function private.guard_profile_columns();
create trigger clients_guard_columns before update on public.clients
  for each row execute function private.guard_client_columns();

create trigger log_drinks_recalculate_water
  after insert or update or delete on public.log_drinks
  for each row execute function private.recalculate_water_total();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Repoint policies
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or private.is_coach_of(id)
    or exists (
      select 1
      from public.clients c
      where c.profile_id = auth.uid()
        and c.nutritionist_id = profiles.id
    )
  );

drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients
  for select to authenticated
  using (private.can_access_client(profile_id));

drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients
  for update to authenticated
  using (private.can_access_client(profile_id))
  with check (private.can_access_client(profile_id));

drop policy if exists supplements_select on public.supplements;
create policy supplements_select on public.supplements
  for select to authenticated
  using (private.can_access_client(client_id));

drop policy if exists supplements_insert on public.supplements;
create policy supplements_insert on public.supplements
  for insert to authenticated
  with check (private.can_access_client(client_id));

drop policy if exists supplements_update on public.supplements;
create policy supplements_update on public.supplements
  for update to authenticated
  using (private.can_access_client(client_id))
  with check (private.can_access_client(client_id));

drop policy if exists supplements_delete on public.supplements;
create policy supplements_delete on public.supplements
  for delete to authenticated
  using (private.can_access_client(client_id));

drop policy if exists daily_logs_select on public.daily_logs;
create policy daily_logs_select on public.daily_logs
  for select to authenticated
  using (private.can_access_client(client_id));

drop policy if exists log_meals_select on public.log_meals;
create policy log_meals_select on public.log_meals
  for select to authenticated
  using (private.can_access_log(daily_log_id));

drop policy if exists log_meals_write on public.log_meals;
create policy log_meals_write on public.log_meals
  for all to authenticated
  using (private.owns_log(daily_log_id))
  with check (private.owns_log(daily_log_id));

drop policy if exists log_drinks_select on public.log_drinks;
create policy log_drinks_select on public.log_drinks
  for select to authenticated
  using (private.can_access_log(daily_log_id));

drop policy if exists log_drinks_write on public.log_drinks;
create policy log_drinks_write on public.log_drinks
  for all to authenticated
  using (private.owns_log(daily_log_id))
  with check (private.owns_log(daily_log_id));

drop policy if exists log_stools_select on public.log_stools;
create policy log_stools_select on public.log_stools
  for select to authenticated
  using (private.can_access_log(daily_log_id));

drop policy if exists log_stools_write on public.log_stools;
create policy log_stools_write on public.log_stools
  for all to authenticated
  using (private.owns_log(daily_log_id))
  with check (private.owns_log(daily_log_id));

drop policy if exists log_supplement_intakes_select on public.log_supplement_intakes;
create policy log_supplement_intakes_select on public.log_supplement_intakes
  for select to authenticated
  using (private.can_access_log(daily_log_id));

drop policy if exists log_supplement_intakes_write on public.log_supplement_intakes;
create policy log_supplement_intakes_write on public.log_supplement_intakes
  for all to authenticated
  using (private.owns_log(daily_log_id))
  with check (private.owns_log(daily_log_id));

drop policy if exists body_measurements_select on public.body_measurements;
create policy body_measurements_select on public.body_measurements
  for select to authenticated
  using (private.can_access_client(client_id));

drop policy if exists day_comments_select on public.day_comments;
create policy day_comments_select on public.day_comments
  for select to authenticated
  using (private.can_access_log(daily_log_id));

drop policy if exists day_comments_insert on public.day_comments;
create policy day_comments_insert on public.day_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and private.can_access_log(daily_log_id)
  );

drop policy if exists day_comments_update on public.day_comments;
create policy day_comments_update on public.day_comments
  for update to authenticated
  using (private.can_access_log(daily_log_id))
  with check (private.can_access_log(daily_log_id));

drop policy if exists direct_messages_select on public.direct_messages;
create policy direct_messages_select on public.direct_messages
  for select to authenticated
  using (private.can_access_client(client_id));

drop policy if exists direct_messages_insert on public.direct_messages;
create policy direct_messages_insert on public.direct_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and private.can_access_client(client_id)
  );

drop policy if exists direct_messages_update on public.direct_messages;
create policy direct_messages_update on public.direct_messages
  for update to authenticated
  using (private.can_access_client(client_id))
  with check (private.can_access_client(client_id));

-- ---------------------------------------------------------------------------
-- Retire the public copies
-- ---------------------------------------------------------------------------

drop function if exists public.is_coach_of(uuid);
drop function if exists public.can_access_client(uuid);
drop function if exists public.can_access_log(uuid);
drop function if exists public.owns_log(uuid);
drop function if exists public.set_updated_at();
drop function if exists public.guard_profile_columns();
drop function if exists public.guard_client_columns();
drop function if exists public.recalculate_water_total();
drop function if exists public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Invite-code RPCs stay public, but signed in only
-- ---------------------------------------------------------------------------

-- These two are deliberately reachable over the API. Anonymous callers are not
-- welcome: an open code lookup would let anyone enumerate coaches by guessing
-- codes.
revoke execute on function public.preview_nutritionist(text) from public, anon;
revoke execute on function public.link_nutritionist(text) from public, anon;
grant execute on function public.preview_nutritionist(text) to authenticated;
grant execute on function public.link_nutritionist(text) to authenticated;
