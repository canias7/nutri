-- Row level security for NutriTrack.
--
-- Two access paths exist for every piece of client data: the client themselves,
-- and the nutritionist currently linked to them. Everything else is denied.
--
-- The helpers below are SECURITY DEFINER so they read the linking tables without
-- re-entering the policies that call them, which would recurse.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_coach_of(client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.profile_id = client
      and c.nutritionist_id = auth.uid()
  );
$$;

create or replace function public.can_access_client(client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = client or public.is_coach_of(client);
$$;

create or replace function public.can_access_log(log uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.daily_logs dl
    where dl.id = log
      and public.can_access_client(dl.client_id)
  );
$$;

-- The client owns the diary; a coach may read it and comment, never rewrite it.
create or replace function public.owns_log(log uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.daily_logs dl
    where dl.id = log
      and dl.client_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Column guards
-- ---------------------------------------------------------------------------

-- Roles are assigned at signup and never by the client afterwards.
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
as $$
begin
  new.role := old.role;
  new.id := old.id;
  return new;
end;
$$;

create trigger profiles_guard_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- A nutritionist can edit their client's recommendations, but must not be able
-- to rewrite the client's own biometrics or reassign them to another coach.
create or replace function public.guard_client_columns()
returns trigger
language plpgsql
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
    -- Clients link themselves through link_nutritionist(), which is definer.
    new.nutritionist_id := old.nutritionist_id;
  end if;

  return new;
end;
$$;

create trigger clients_guard_columns
  before update on public.clients
  for each row execute function public.guard_client_columns();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.nutritionists enable row level security;
alter table public.clients enable row level security;
alter table public.supplements enable row level security;
alter table public.daily_logs enable row level security;
alter table public.log_meals enable row level security;
alter table public.log_drinks enable row level security;
alter table public.log_stools enable row level security;
alter table public.log_supplement_intakes enable row level security;
alter table public.body_measurements enable row level security;
alter table public.day_comments enable row level security;
alter table public.direct_messages enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

-- Your own row, your coach's row, and the rows of clients you coach: enough to
-- render names and nothing more.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_coach_of(id)
    or exists (
      select 1
      from public.clients c
      where c.profile_id = auth.uid()
        and c.nutritionist_id = profiles.id
    )
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- nutritionists
-- ---------------------------------------------------------------------------

create policy nutritionists_select on public.nutritionists
  for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1
      from public.clients c
      where c.profile_id = auth.uid()
        and c.nutritionist_id = nutritionists.profile_id
    )
  );

create policy nutritionists_update on public.nutritionists
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------

create policy clients_select on public.clients
  for select to authenticated
  using (public.can_access_client(profile_id));

-- Column-level protection lives in guard_client_columns above.
create policy clients_update on public.clients
  for update to authenticated
  using (public.can_access_client(profile_id))
  with check (public.can_access_client(profile_id));

-- ---------------------------------------------------------------------------
-- supplements
-- ---------------------------------------------------------------------------

-- The coach prescribes, so both sides may maintain the list.
create policy supplements_select on public.supplements
  for select to authenticated
  using (public.can_access_client(client_id));

create policy supplements_insert on public.supplements
  for insert to authenticated
  with check (public.can_access_client(client_id));

create policy supplements_update on public.supplements
  for update to authenticated
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy supplements_delete on public.supplements
  for delete to authenticated
  using (public.can_access_client(client_id));

-- ---------------------------------------------------------------------------
-- daily_logs and its children
-- ---------------------------------------------------------------------------

create policy daily_logs_select on public.daily_logs
  for select to authenticated
  using (public.can_access_client(client_id));

create policy daily_logs_insert on public.daily_logs
  for insert to authenticated
  with check (client_id = auth.uid());

create policy daily_logs_update on public.daily_logs
  for update to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy daily_logs_delete on public.daily_logs
  for delete to authenticated
  using (client_id = auth.uid());

create policy log_meals_select on public.log_meals
  for select to authenticated
  using (public.can_access_log(daily_log_id));

create policy log_meals_write on public.log_meals
  for all to authenticated
  using (public.owns_log(daily_log_id))
  with check (public.owns_log(daily_log_id));

create policy log_drinks_select on public.log_drinks
  for select to authenticated
  using (public.can_access_log(daily_log_id));

create policy log_drinks_write on public.log_drinks
  for all to authenticated
  using (public.owns_log(daily_log_id))
  with check (public.owns_log(daily_log_id));

create policy log_stools_select on public.log_stools
  for select to authenticated
  using (public.can_access_log(daily_log_id));

create policy log_stools_write on public.log_stools
  for all to authenticated
  using (public.owns_log(daily_log_id))
  with check (public.owns_log(daily_log_id));

create policy log_supplement_intakes_select on public.log_supplement_intakes
  for select to authenticated
  using (public.can_access_log(daily_log_id));

create policy log_supplement_intakes_write on public.log_supplement_intakes
  for all to authenticated
  using (public.owns_log(daily_log_id))
  with check (public.owns_log(daily_log_id));

-- ---------------------------------------------------------------------------
-- body_measurements
-- ---------------------------------------------------------------------------

create policy body_measurements_select on public.body_measurements
  for select to authenticated
  using (public.can_access_client(client_id));

create policy body_measurements_write on public.body_measurements
  for all to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------------

create policy day_comments_select on public.day_comments
  for select to authenticated
  using (public.can_access_log(daily_log_id));

create policy day_comments_insert on public.day_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_access_log(daily_log_id)
  );

-- Either party marks a message read, so updates stay open to both; deletes are
-- limited to whoever wrote it.
create policy day_comments_update on public.day_comments
  for update to authenticated
  using (public.can_access_log(daily_log_id))
  with check (public.can_access_log(daily_log_id));

create policy day_comments_delete on public.day_comments
  for delete to authenticated
  using (author_id = auth.uid());

create policy direct_messages_select on public.direct_messages
  for select to authenticated
  using (public.can_access_client(client_id));

create policy direct_messages_insert on public.direct_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_access_client(client_id)
  );

create policy direct_messages_update on public.direct_messages
  for update to authenticated
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy direct_messages_delete on public.direct_messages
  for delete to authenticated
  using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Invite codes
-- ---------------------------------------------------------------------------

-- Looking a code up must not mean being able to read the nutritionists table,
-- so both of these are definer functions returning only what the UI shows.

create or replace function public.preview_nutritionist(code text)
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name
  from public.nutritionists n
  join public.profiles p on p.id = n.profile_id
  where n.invite_code = lower(btrim(code))
  limit 1;
$$;

create or replace function public.link_nutritionist(code text)
returns table (id uuid, full_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  coach_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select n.profile_id into coach_id
  from public.nutritionists n
  where n.invite_code = lower(btrim(code));

  if coach_id is null then
    raise exception 'invite_code_not_found' using errcode = 'P0002';
  end if;

  update public.clients c
  set nutritionist_id = coach_id
  where c.profile_id = auth.uid();

  if not found then
    raise exception 'not_a_client' using errcode = 'P0002';
  end if;

  return query
    select p.id, p.full_name
    from public.profiles p
    where p.id = coach_id;
end;
$$;

-- Definer functions are executable by everyone by default; narrow that to the
-- roles that should actually be calling them.
revoke execute on function public.preview_nutritionist(text) from public;
revoke execute on function public.link_nutritionist(text) from public;
grant execute on function public.preview_nutritionist(text) to authenticated;
grant execute on function public.link_nutritionist(text) to authenticated;
