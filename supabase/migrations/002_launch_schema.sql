create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.number_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled set',
  inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_status_check check (
    status in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')
  )
);

create unique index if not exists subscriptions_user_provider_idx
  on public.subscriptions(user_id, provider);

create index if not exists number_sets_user_updated_idx
  on public.number_sets(user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists number_sets_set_updated_at on public.number_sets;
create trigger number_sets_set_updated_at
before update on public.number_sets
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        nickname = coalesce(nullif(public.profiles.nickname, ''), excluded.nickname);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.number_sets enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Number sets are readable by owner" on public.number_sets;
create policy "Number sets are readable by owner"
on public.number_sets for select
using (auth.uid() = user_id);

drop policy if exists "Number sets are insertable by owner" on public.number_sets;
create policy "Number sets are insertable by owner"
on public.number_sets for insert
with check (auth.uid() = user_id);

drop policy if exists "Number sets are updatable by owner" on public.number_sets;
create policy "Number sets are updatable by owner"
on public.number_sets for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Number sets are deletable by owner" on public.number_sets;
create policy "Number sets are deletable by owner"
on public.number_sets for delete
using (auth.uid() = user_id);

drop policy if exists "Subscriptions are readable by owner" on public.subscriptions;
create policy "Subscriptions are readable by owner"
on public.subscriptions for select
using (auth.uid() = user_id);
