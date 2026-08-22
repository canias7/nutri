-- ---------------------------------------------------------------------------
-- Three more answers the daily check-in asks for
-- ---------------------------------------------------------------------------
--
-- Restroom needs no schema at all: log_stools has been there since the first
-- migration, with its policies and its index. Only the section on top of it was
-- taken away, and it is coming back.
--
-- The other two are new columns on the day.

alter table public.daily_logs
  add column sleep_hours numeric(3, 1) check (sleep_hours >= 0 and sleep_hours <= 24),
  -- Three states, and the third one matters: nobody has answered yet. A boolean
  -- defaulting to false would tell the nutritionist "no" on every day nobody
  -- touched, which is a different claim from silence.
  add column on_period boolean;

comment on column public.daily_logs.sleep_hours is
  'How long the client slept the night before this day, in hours. Recorded in '
  'the morning next to the wake-up time, which is when they know the answer — '
  'bed_time on this row is the night that follows.';

comment on column public.daily_logs.on_period is
  'Whether the client was on their period. Null means unanswered, not no.';
