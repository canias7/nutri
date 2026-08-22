-- NutriTrack core schema: nutrition diary with nutritionist coaching.
--
-- Shape of the domain: a client keeps one diary row per day, made of several
-- sections they fill in as the day goes. A nutritionist is linked to clients by
-- an invite code and comments on individual days.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('client', 'nutritionist', 'admin');

-- Ordered as they appear through the day, so `order by slot` sorts sensibly.
create type public.meal_slot as enum (
  'first_warm_drink',
  'breakfast',
  'second_breakfast',
  'lunch',
  'snack',
  'dinner'
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  full_name text not null default '',
  email text,
  -- The original app is Russian-first with English available; both are carried
  -- so a user's choice survives across devices.
  language text not null default 'en' check (language in ('en', 'ru')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user, created automatically on signup.';

create table public.nutritionists (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  -- Clients type this to link themselves to a coach, so it is compared
  -- case-insensitively and must be unique across all coaches.
  invite_code text unique
    check (invite_code is null or invite_code ~ '^[a-z0-9_-]{3,40}$'),
  headline text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  -- Kept when a coach is deleted: the client's diary is theirs, the link is not.
  nutritionist_id uuid references public.profiles (id) on delete set null,

  -- Biometrics captured at onboarding.
  age integer check (age is null or age between 1 and 130),
  gender text,
  height_cm numeric(5, 1) check (height_cm is null or height_cm between 30 and 280),
  start_weight_kg numeric(5, 2) check (start_weight_kg is null or start_weight_kg between 10 and 500),

  goal text not null default '',
  goal_deadline date,

  -- { emotional, digestion, skin, other } — the baseline questionnaire.
  initial_complaints jsonb not null default '{}'::jsonb,

  -- Free text the nutritionist maintains for this client.
  recommendations text not null default '',

  water_target_ml integer not null default 2000 check (water_target_ml > 0),

  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_nutritionist_id_idx
  on public.clients (nutritionist_id)
  where nutritionist_id is not null;

-- ---------------------------------------------------------------------------
-- Regular supplements
-- ---------------------------------------------------------------------------

create table public.supplements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (profile_id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  dose text not null default '',
  take_morning boolean not null default false,
  take_daytime boolean not null default false,
  take_evening boolean not null default false,
  -- Retired supplements stay for history but drop off the daily checklist.
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index supplements_client_id_idx on public.supplements (client_id);

-- ---------------------------------------------------------------------------
-- Daily log
-- ---------------------------------------------------------------------------

-- Scalar metrics get real columns because they are charted (weight over 14 days,
-- water average, stress against energy). Free text stays text.
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (profile_id) on delete cascade,
  log_date date not null,

  -- Morning
  wake_time time,
  waking_mood text not null default '',
  weight_kg numeric(5, 2) check (weight_kg is null or weight_kg between 10 and 500),
  morning_activity text not null default '',
  energy_level smallint check (energy_level is null or energy_level between 1 and 10),
  first_warm_drink text not null default '',

  -- Day
  activity_type text not null default '',
  activity_minutes integer check (activity_minutes is null or activity_minutes >= 0),
  stress_level smallint check (stress_level is null or stress_level between 0 and 10),
  stress_relief text not null default '',
  outdoor_minutes integer check (outdoor_minutes is null or outdoor_minutes >= 0),

  -- Supplements taken off-list, alongside the checklist in log_supplement_intakes.
  extra_supplements text not null default '',

  -- Evening
  evening_ritual text not null default '',
  gadgets_off_at time,
  bed_time time,

  -- Complaints
  complaint_emotional text not null default '',
  complaint_skin text not null default '',
  complaint_digestion text not null default '',
  complaint_other text not null default '',

  -- Maintained by trigger from log_drinks; denormalised so the dashboard can
  -- read a fortnight of hydration without joining and aggregating every time.
  water_total_ml integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (client_id, log_date)
);

create index daily_logs_client_date_idx
  on public.daily_logs (client_id, log_date desc);

create table public.log_meals (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  slot public.meal_slot not null,
  eaten text not null default '',
  amount text not null default '',
  method text not null default '',
  eaten_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (daily_log_id, slot)
);

create index log_meals_daily_log_id_idx on public.log_meals (daily_log_id);

create table public.log_drinks (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  kind text not null default '',
  volume_ml integer not null check (volume_ml > 0),
  -- Only clean water counts toward the hydration target; tea and the rest are
  -- logged but tracked separately.
  counts_as_water boolean not null default true,
  drank_at time,
  created_at timestamptz not null default now()
);

create index log_drinks_daily_log_id_idx on public.log_drinks (daily_log_id);

create table public.log_stools (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  occurred_at time,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index log_stools_daily_log_id_idx on public.log_stools (daily_log_id);

create table public.log_supplement_intakes (
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (daily_log_id, supplement_id)
);

-- ---------------------------------------------------------------------------
-- Body measurements
-- ---------------------------------------------------------------------------

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (profile_id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5, 2),
  -- All circumferences in cm; the UI converts from inches on the way in.
  chest_cm numeric(5, 1),
  waist_cm numeric(5, 1),
  hips_cm numeric(5, 1),
  upper_arm_left_cm numeric(5, 1),
  upper_arm_right_cm numeric(5, 1),
  thigh_left_cm numeric(5, 1),
  thigh_right_cm numeric(5, 1),
  above_knee_left_cm numeric(5, 1),
  above_knee_right_cm numeric(5, 1),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (client_id, measured_on)
);

create index body_measurements_client_idx
  on public.body_measurements (client_id, measured_on desc);

-- ---------------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------------

-- Discussion attached to one diary day.
create table public.day_comments (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index day_comments_daily_log_idx
  on public.day_comments (daily_log_id, created_at);

-- The general client/coach thread, not tied to any particular day.
create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (profile_id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index direct_messages_client_idx
  on public.direct_messages (client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger nutritionists_set_updated_at before update on public.nutritionists
  for each row execute function public.set_updated_at();
create trigger clients_set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger supplements_set_updated_at before update on public.supplements
  for each row execute function public.set_updated_at();
create trigger daily_logs_set_updated_at before update on public.daily_logs
  for each row execute function public.set_updated_at();
create trigger log_meals_set_updated_at before update on public.log_meals
  for each row execute function public.set_updated_at();
create trigger body_measurements_set_updated_at before update on public.body_measurements
  for each row execute function public.set_updated_at();

-- Keeps daily_logs.water_total_ml in step with the drinks rows behind it.
create or replace function public.recalculate_water_total()
returns trigger
language plpgsql
security definer
set search_path = public
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

create trigger log_drinks_recalculate_water
  after insert or update or delete on public.log_drinks
  for each row execute function public.recalculate_water_total();

-- Every new auth user gets a profile, and the matching role-specific row, so the
-- app never has to cope with a half-registered account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

  -- Nobody gets to make themselves an admin by editing the signup payload.
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
