-- 구독(결제) 상태 테이블. 라이브 스키마와 일치하는 idempotent 정의.
-- Stripe(그리고 향후 다른 PG)의 결제 상태를 사용자별로 1행 동기화한다.
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 결제 제공자 식별자. 현재 'stripe'. 국내 PG 도입 시 'portan' 등 확장 가능.
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null default 'inactive'
    check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

-- 소유자는 자신의 구독 상태만 읽을 수 있다(isPro 판정용).
drop policy if exists "Subscriptions are readable by owner" on public.subscriptions;
create policy "Subscriptions are readable by owner"
on public.subscriptions for select
using ((select auth.uid()) = user_id);

-- insert/update/delete 정책은 두지 않는다.
-- 결제 상태는 Stripe webhook이 service_role 키로 RLS를 우회해 동기화하며,
-- 클라이언트(anon/authenticated)는 구독 상태를 절대 직접 쓸 수 없다.
