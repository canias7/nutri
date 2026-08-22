-- ---------------------------------------------------------------------------
-- One nutritionist, every client attached to them.
-- ---------------------------------------------------------------------------

-- The schema was built for a directory of specialists, each with an invite code
-- their clients typed in. There is one nutritionist, seeing everybody, so the
-- code was a step between a person and their diary that decided nothing. Clients
-- are attached on sign-up instead.
--
-- The column and the RPC stay. Whoever is running the practice is still a row
-- rather than a constant, which is what an admin portal will need — and the
-- access rules already read that column, so nothing about who can see what
-- changes here.

create or replace function private.the_nutritionist()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  -- Oldest wins, so adding a second account later cannot silently reassign
  -- everybody to it.
  select n.profile_id
  from public.nutritionists n
  join public.profiles p on p.id = n.profile_id
  order by p.created_at
  limit 1;
$$;

comment on function private.the_nutritionist() is
  'The practice''s nutritionist. One account sees every client; this is who new '
  'clients are attached to.';

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
    -- Null while there is no nutritionist yet, which the backfill below picks
    -- up the moment one exists.
    insert into public.clients (profile_id, nutritionist_id)
    values (new.id, private.the_nutritionist());
  end if;

  return new;
end;
$$;

-- Everyone already signed up. guard_client_columns reverts this column for
-- anyone who is not the row's owner — which is the point of it, and why the
-- trigger has to stand aside for one statement.
alter table public.clients disable trigger clients_guard_columns;

update public.clients
set nutritionist_id = private.the_nutritionist()
where nutritionist_id is null
  and private.the_nutritionist() is not null;

alter table public.clients enable trigger clients_guard_columns;
