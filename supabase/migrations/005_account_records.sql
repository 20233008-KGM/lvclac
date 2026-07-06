create table if not exists public.order_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position_side text not null check (position_side in ('long', 'short')),
  order_contracts numeric not null,
  order_price numeric not null,
  before_inputs jsonb not null default '{}'::jsonb,
  after_inputs jsonb not null default '{}'::jsonb,
  before_result jsonb not null default '{}'::jsonb,
  after_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.account_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Account snapshot',
  inputs jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_history_user_created_idx
  on public.order_history(user_id, created_at desc);

create index if not exists account_snapshots_user_created_idx
  on public.account_snapshots(user_id, created_at desc);

alter table public.order_history enable row level security;
alter table public.account_snapshots enable row level security;

drop policy if exists "Order history is readable by owner" on public.order_history;
create policy "Order history is readable by owner"
on public.order_history for select
using ((select auth.uid()) = user_id);

drop policy if exists "Order history is insertable by owner" on public.order_history;
create policy "Order history is insertable by owner"
on public.order_history for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Order history is deletable by owner" on public.order_history;
create policy "Order history is deletable by owner"
on public.order_history for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Account snapshots are readable by owner" on public.account_snapshots;
create policy "Account snapshots are readable by owner"
on public.account_snapshots for select
using ((select auth.uid()) = user_id);

drop policy if exists "Account snapshots are insertable by owner" on public.account_snapshots;
create policy "Account snapshots are insertable by owner"
on public.account_snapshots for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Account snapshots are deletable by owner" on public.account_snapshots;
create policy "Account snapshots are deletable by owner"
on public.account_snapshots for delete
using ((select auth.uid()) = user_id);
