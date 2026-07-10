create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_admin() from public;
revoke execute on function private.is_admin() from anon;
revoke execute on function private.is_admin() from authenticated;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Users can read their own admin marker"
on public.admin_users for select
using ((select auth.uid()) = user_id);

drop policy if exists "Feedback posts are readable by owner or admin" on public.feedback_posts;
create policy "Feedback posts are readable by owner or admin"
on public.feedback_posts for select
using (((select auth.uid()) = user_id) or private.is_admin());

drop policy if exists "Feedback post status is updatable by admin" on public.feedback_posts;
create policy "Feedback post status is updatable by admin"
on public.feedback_posts for update
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Feedback attachments are readable by owner or admin" on storage.objects;
create policy "Feedback attachments are readable by owner or admin"
on storage.objects for select
using (
  bucket_id = 'feedback-attachments'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or private.is_admin()
  )
);

drop function if exists public.is_admin();
