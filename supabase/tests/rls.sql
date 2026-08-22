-- Row level security regression test.
--
-- Runs entirely inside a transaction that rolls back, so it is safe against any
-- database including production. Paste it into the Supabase SQL editor, or:
--
--   psql "$DATABASE_URL" -f supabase/tests/rls.sql
--
-- Every `detail` in the output is expected to read as the value in brackets.
-- Anything else is a security regression.

begin;

create temp table results(step text, detail text) on commit drop;
grant insert, select on results to authenticated;

-- Two clients and one coach. The signup trigger fills in the profile rows.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', '{"full_name":"Client A"}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', '{"full_name":"Client B"}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'n@test.local', '{"full_name":"Coach N","role":"nutritionist"}'::jsonb);

insert into results
select 'signup_trigger [profiles=3 clients=2 nutritionists=1]',
       'profiles=' || (select count(*) from public.profiles)::text ||
       ' clients=' || (select count(*) from public.clients)::text ||
       ' nutritionists=' || (select count(*) from public.nutritionists)::text;

update public.nutritionists set invite_code = 'coach_test'
where profile_id = '33333333-3333-3333-3333-333333333333';

-- ---------------------------------------------------------------------------
-- Client A: link to the coach, log a day
-- ---------------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into results
select 'link_rpc_returns [Coach N]',
       coalesce((select full_name from public.link_nutritionist('coach_test')), 'NOTHING');

insert into public.daily_logs (client_id, log_date, weight_kg, energy_level)
values ('11111111-1111-1111-1111-111111111111', '2026-08-22', 70.5, 7);

insert into public.log_drinks (daily_log_id, kind, volume_ml)
select id, 'water', 500 from public.daily_logs where client_id = '11111111-1111-1111-1111-111111111111';
insert into public.log_drinks (daily_log_id, kind, volume_ml)
select id, 'water', 750 from public.daily_logs where client_id = '11111111-1111-1111-1111-111111111111';
insert into public.log_drinks (daily_log_id, kind, volume_ml)
select id, 'coffee', 200 from public.daily_logs where client_id = '11111111-1111-1111-1111-111111111111';

insert into results select 'A_sees_own_logs [1]', count(*)::text from public.daily_logs;

-- Every drink counts now, coffee included: 500 + 750 + 200.
insert into results select 'water_total_trigger [1450]',
  (select water_total_ml::text from public.daily_logs
   where client_id = '11111111-1111-1111-1111-111111111111');

-- Reassigning your own coach must go through link_nutritionist().
do $$
begin
  update public.clients set nutritionist_id = null
  where profile_id = '11111111-1111-1111-1111-111111111111';
  insert into results values ('A_rewrites_coach_directly [blocked]', 'ALLOWED — BAD');
exception when others then
  insert into results values ('A_rewrites_coach_directly [blocked]', 'blocked (' || sqlstate || ')');
end $$;

update public.clients set recommendations = 'self-written'
where profile_id = '11111111-1111-1111-1111-111111111111';

reset role;
insert into results select 'A_writes_own_recommendations [ignored]',
  case when (select recommendations from public.clients
             where profile_id = '11111111-1111-1111-1111-111111111111') = ''
       then 'ignored (good)' else 'PERSISTED — BAD' end;

-- ---------------------------------------------------------------------------
-- Client B: sees nothing of A's
-- ---------------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

insert into public.daily_logs (client_id, log_date, weight_kg)
values ('22222222-2222-2222-2222-222222222222', '2026-08-22', 88.0);

insert into results select 'B_sees_own_logs_only [1]', count(*)::text from public.daily_logs;
insert into results select 'B_sees_A_profile [0]', count(*)::text from public.clients
  where profile_id = '11111111-1111-1111-1111-111111111111';
insert into results select 'B_sees_A_drinks [0]', count(*)::text from public.log_drinks;

-- ---------------------------------------------------------------------------
-- The coach: sees their own client only
-- ---------------------------------------------------------------------------

reset role;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

insert into results select 'coach_sees_logs [1]', count(*)::text from public.daily_logs;
insert into results select 'coach_sees_clients [1]', count(*)::text from public.clients;
insert into results select 'coach_sees_A_drinks [3]', count(*)::text from public.log_drinks;

update public.clients set recommendations = 'Add more protein at breakfast.'
where profile_id = '11111111-1111-1111-1111-111111111111';

update public.clients set goal = 'hijacked', age = 99
where profile_id = '11111111-1111-1111-1111-111111111111';

insert into public.day_comments (daily_log_id, author_id, body)
select id, '33333333-3333-3333-3333-333333333333', 'How was your energy today?'
from public.daily_logs where client_id = '11111111-1111-1111-1111-111111111111';

reset role;
insert into results select 'coach_wrote_recommendations [Add more protein at breakfast.]',
  (select recommendations from public.clients
   where profile_id = '11111111-1111-1111-1111-111111111111');
insert into results select 'coach_hijacked_goal [blocked]',
  case when (select goal from public.clients
             where profile_id = '11111111-1111-1111-1111-111111111111') = ''
       then 'blocked (good)' else 'HIJACKED — BAD' end;

-- ---------------------------------------------------------------------------
-- Client B reaching for A's diary
-- ---------------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

insert into results select 'B_sees_A_comments [0]', count(*)::text from public.day_comments;

do $$
declare a_log uuid;
begin
  select id into a_log from public.daily_logs
  where client_id = '11111111-1111-1111-1111-111111111111';
  if a_log is null then
    insert into results values ('B_comments_on_A_log [blocked]', 'cannot even see the log (good)');
  else
    insert into public.day_comments (daily_log_id, author_id, body)
    values (a_log, '22222222-2222-2222-2222-222222222222', 'snooping');
    insert into results values ('B_comments_on_A_log [blocked]', 'ALLOWED — BAD');
  end if;
exception when others then
  insert into results values ('B_comments_on_A_log [blocked]', 'blocked (' || sqlstate || ')');
end $$;

reset role;
select * from results;

rollback;
