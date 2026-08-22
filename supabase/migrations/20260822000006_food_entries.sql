-- ---------------------------------------------------------------------------
-- Meals become a free list, and every drink counts toward the water target.
-- ---------------------------------------------------------------------------

-- The diary asked about five named meals — breakfast, second breakfast, lunch,
-- snack, dinner — and gave each its own box whether or not it happened. Most
-- days that is four empty boxes and one filled in, and it has nothing to say
-- about a sixth meal. One "Food" section holding as many entries as the day
-- actually had fits how people eat rather than how a form was laid out.
--
-- Entries are keyed by their position in the day instead, so saving the section
-- is an upsert per row rather than a delete and a re-insert — a failed write
-- leaves the previous answers in place instead of nothing at all.

alter table public.log_meals
  drop constraint log_meals_daily_log_id_slot_key;

-- Kept, nullable, for the days already logged: which meal a row was is worth
-- more as history than the column costs. Nothing writes it from here on.
alter table public.log_meals
  alter column slot drop not null;

comment on column public.log_meals.slot is
  'Historic only. Rows logged before food entries became a free list carry the '
  'named meal they were entered under; new rows leave this null.';

alter table public.log_meals
  add column sort_order integer not null default 0;

-- Existing days keep their order: the enum is declared in the order the meals
-- happen, so ordering by it reproduces breakfast-first.
update public.log_meals m
set sort_order = ranked.position
from (
  select
    id,
    (row_number() over (partition by daily_log_id order by slot, created_at) - 1)
      as position
  from public.log_meals
) as ranked
where m.id = ranked.id;

alter table public.log_meals
  add constraint log_meals_daily_log_id_sort_order_key
  unique (daily_log_id, sort_order);

-- ---------------------------------------------------------------------------
-- Water
-- ---------------------------------------------------------------------------

-- Every drink counted separately meant a checkbox on every entry, and a total
-- that disagreed with the list above it. Everything logged now counts.
alter table public.log_drinks
  drop column counts_as_water;

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
    ),
    0
  )
  where id = target_log;

  return null;
end;
$$;

-- Drinks that were logged as not counting are part of the total now, so every
-- day that has any has to be added up again.
update public.daily_logs d
set water_total_ml = coalesce(
  (select sum(volume_ml) from public.log_drinks where daily_log_id = d.id),
  0
);
