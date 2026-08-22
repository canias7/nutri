-- Fixes a silent failure in invite-code linking.
--
-- guard_client_columns stopped a client from rewriting their own
-- `nutritionist_id` through a plain table update. But link_nutritionist() is
-- SECURITY DEFINER and still runs with the *client* as auth.uid(), so the guard
-- reverted the very write the function exists to make: the RPC returned the
-- coach's name while the link was quietly dropped.
--
-- The rule belongs at the privilege layer instead. `authenticated` is granted
-- UPDATE on the columns a user may edit and no others, so an API caller cannot
-- touch `nutritionist_id` at all, while a definer function — which runs as the
-- owner — still can. The trigger goes back to what it is good at: deciding
-- which of the *granted* columns a coach may write on someone else's row.

-- ---------------------------------------------------------------------------
-- Column-level privileges
-- ---------------------------------------------------------------------------

revoke update on public.clients from authenticated, anon;
grant update (
  age,
  gender,
  height_cm,
  start_weight_kg,
  goal,
  goal_deadline,
  initial_complaints,
  recommendations,
  water_target_ml,
  onboarding_completed_at
) on public.clients to authenticated;

revoke update on public.profiles from authenticated, anon;
grant update (full_name, language) on public.profiles to authenticated;

revoke update on public.nutritionists from authenticated, anon;
grant update (invite_code, headline) on public.nutritionists to authenticated;

-- ---------------------------------------------------------------------------
-- Trigger
-- ---------------------------------------------------------------------------

create or replace function private.guard_client_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is distinct from old.profile_id then
    -- Someone other than the client — in practice their coach, since RLS lets
    -- nobody else near the row. They may write recommendations and the water
    -- target; the client's own answers stay the client's.
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
    -- The client edits their own profile. Recommendations are the coach's to
    -- write, and linking goes through link_nutritionist(), which runs as the
    -- table owner and so is unaffected by the grants above.
    new.recommendations := old.recommendations;
  end if;

  return new;
end;
$$;
