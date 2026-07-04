create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles for select
using ((select auth.uid()) = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert
with check ((select auth.uid()) = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Number sets are readable by owner" on public.number_sets;
create policy "Number sets are readable by owner"
on public.number_sets for select
using ((select auth.uid()) = user_id);

drop policy if exists "Number sets are insertable by owner" on public.number_sets;
create policy "Number sets are insertable by owner"
on public.number_sets for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Number sets are updatable by owner" on public.number_sets;
create policy "Number sets are updatable by owner"
on public.number_sets for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Number sets are deletable by owner" on public.number_sets;
create policy "Number sets are deletable by owner"
on public.number_sets for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Subscriptions are readable by owner" on public.subscriptions;
create policy "Subscriptions are readable by owner"
on public.subscriptions for select
using ((select auth.uid()) = user_id);
