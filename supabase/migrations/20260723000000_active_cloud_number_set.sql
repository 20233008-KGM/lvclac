-- Remember the last cloud number set selected by each signed-in user.
-- The preference is account-scoped so a new browser can restore the same set.

begin;

alter table public.profiles
  add column if not exists active_cloud_number_set_id uuid;

alter table public.profiles
  drop constraint if exists profiles_active_cloud_number_set_id_fkey;

alter table public.profiles
  add constraint profiles_active_cloud_number_set_id_fkey
  foreign key (active_cloud_number_set_id)
  references public.number_sets(id)
  on delete set null;

create or replace function public.validate_profile_active_cloud_number_set()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.active_cloud_number_set_id is not null
    and not exists (
      select 1
      from public.number_sets number_set
      where number_set.id = new.active_cloud_number_set_id
        and number_set.user_id = new.id
    )
  then
    raise exception 'active cloud number set must belong to the profile owner'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_validate_active_cloud_number_set on public.profiles;
create trigger profiles_validate_active_cloud_number_set
before insert or update of active_cloud_number_set_id on public.profiles
for each row execute function public.validate_profile_active_cloud_number_set();

revoke all on function public.validate_profile_active_cloud_number_set() from public;

commit;
