create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
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

revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users for select
using (public.is_admin());

create table if not exists public.feedback_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id text not null,
  title text not null,
  body text not null,
  author text not null default '',
  contact text not null default '',
  status text not null default 'new',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_posts_board_id_check check (board_id in ('dev-request', 'bugs', 'suggestions')),
  constraint feedback_posts_status_check check (status in ('new', 'reviewed', 'in_progress', 'done', 'on_hold')),
  constraint feedback_posts_title_not_blank check (length(btrim(title)) > 0),
  constraint feedback_posts_body_not_blank check (length(btrim(body)) > 0),
  constraint feedback_posts_attachments_array_check check (jsonb_typeof(attachments) = 'array')
);

create index if not exists feedback_posts_user_board_created_idx
  on public.feedback_posts(user_id, board_id, created_at desc);

create index if not exists feedback_posts_admin_created_idx
  on public.feedback_posts(created_at desc);

create index if not exists feedback_posts_admin_board_status_created_idx
  on public.feedback_posts(board_id, status, created_at desc);

drop trigger if exists feedback_posts_set_updated_at on public.feedback_posts;
create trigger feedback_posts_set_updated_at
before update on public.feedback_posts
for each row execute function public.set_updated_at();

alter table public.feedback_posts enable row level security;

drop policy if exists "Feedback posts are readable by owner or admin" on public.feedback_posts;
create policy "Feedback posts are readable by owner or admin"
on public.feedback_posts for select
using (((select auth.uid()) = user_id) or public.is_admin());

drop policy if exists "Feedback posts are insertable by owner" on public.feedback_posts;
create policy "Feedback posts are insertable by owner"
on public.feedback_posts for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Feedback post status is updatable by admin" on public.feedback_posts;
create policy "Feedback post status is updatable by admin"
on public.feedback_posts for update
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-attachments',
  'feedback-attachments',
  false,
  1048576,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Feedback attachments are readable by owner or admin" on storage.objects;
create policy "Feedback attachments are readable by owner or admin"
on storage.objects for select
using (
  bucket_id = 'feedback-attachments'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
  )
);

drop policy if exists "Feedback attachments are insertable by owner" on storage.objects;
create policy "Feedback attachments are insertable by owner"
on storage.objects for insert
with check (
  bucket_id = 'feedback-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
