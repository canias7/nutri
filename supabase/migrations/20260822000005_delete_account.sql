-- Lets someone delete their own account.
--
-- Deleting an auth user is not something the browser can do with a publishable
-- key, and it should not need a service-role key sitting in the app either. A
-- definer function that only ever touches auth.uid() gives exactly the one
-- capability required and nothing else.
--
-- Everything else goes with it: profiles cascades from auth.users, and clients,
-- diaries, meals, drinks, measurements, supplements and messages all cascade
-- from there. For a health diary that is the point — "delete my account" has to
-- mean the data is gone, not hidden.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
