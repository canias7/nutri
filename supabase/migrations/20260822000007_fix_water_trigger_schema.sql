-- ---------------------------------------------------------------------------
-- Point the water total at the function that actually runs.
-- ---------------------------------------------------------------------------

-- Dropping log_drinks.counts_as_water in the previous migration broke every
-- insert with "column counts_as_water does not exist" — raised not by the
-- insert but by the trigger behind it, which still selected on the column.
--
-- The replacement went to public.recalculate_water_total(). The trigger has
-- fired private.recalculate_water_total() since the functions were hardened,
-- so the definition that mattered was left untouched and a copy of the old
-- public one was recreated alongside it.

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
    ),
    0
  )
  where id = target_log;

  return null;
end;
$$;

-- Hardening put every helper in `private` precisely so that nothing in the
-- schema PostgREST publishes is callable over the API. The public copy was an
-- accident of the last migration and goes back out.
drop function if exists public.recalculate_water_total();

update public.daily_logs d
set water_total_ml = coalesce(
  (select sum(volume_ml) from public.log_drinks where daily_log_id = d.id),
  0
);
