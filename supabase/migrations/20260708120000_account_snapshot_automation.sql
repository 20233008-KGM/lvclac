alter table public.account_snapshots
  add column if not exists source text not null default 'manual';

alter table public.account_snapshots
  add column if not exists source_local_date date;

do $$
begin
  alter table public.account_snapshots
    add constraint account_snapshots_source_check
    check (source in ('manual', 'auto'));
exception
  when duplicate_object then null;
end;
$$;

create unique index if not exists account_snapshots_auto_user_local_date_idx
  on public.account_snapshots(user_id, source_local_date)
  where source = 'auto' and source_local_date is not null;

create table if not exists public.account_snapshot_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  label text not null default 'Daily close',
  time_zone text not null default 'UTC',
  time_of_day text not null default '16:00',
  next_run_at timestamptz,
  last_run_at timestamptz,
  last_run_local_date date,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_snapshot_settings_time_of_day_check
    check (time_of_day ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

create index if not exists account_snapshot_settings_due_idx
  on public.account_snapshot_settings(next_run_at)
  where enabled = true;

drop trigger if exists account_snapshot_settings_set_updated_at
  on public.account_snapshot_settings;
create trigger account_snapshot_settings_set_updated_at
before update on public.account_snapshot_settings
for each row execute function public.set_updated_at();

alter table public.account_snapshot_settings enable row level security;

drop policy if exists "Account snapshot settings are readable by owner"
  on public.account_snapshot_settings;
create policy "Account snapshot settings are readable by owner"
on public.account_snapshot_settings for select
using ((select auth.uid()) = user_id);

drop policy if exists "Account snapshot settings are insertable by owner"
  on public.account_snapshot_settings;
create policy "Account snapshot settings are insertable by owner"
on public.account_snapshot_settings for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Account snapshot settings are updatable by owner"
  on public.account_snapshot_settings;
create policy "Account snapshot settings are updatable by owner"
on public.account_snapshot_settings for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Account snapshot settings are deletable by owner"
  on public.account_snapshot_settings;
create policy "Account snapshot settings are deletable by owner"
on public.account_snapshot_settings for delete
using ((select auth.uid()) = user_id);
