-- ---------------------------------------------------------------------------
-- When a day was handed over.
-- ---------------------------------------------------------------------------

-- Every section saves itself as it is typed, which is what keeps a half-filled
-- day safe. What that never gave anyone was a moment of having finished — so
-- the diary has one button that says the day is ready to be read, and this
-- records when it was pressed.
--
-- Nullable and re-settable on purpose: going back to change an answer and
-- pressing it again is normal, and moves the stamp forward.

alter table public.daily_logs
  add column posted_at timestamptz;

comment on column public.daily_logs.posted_at is
  'When the client last posted this day. Null means still being filled in; '
  'editing after posting and pressing it again moves the stamp forward.';

create index daily_logs_posted_idx
  on public.daily_logs (client_id, posted_at desc nulls last);
