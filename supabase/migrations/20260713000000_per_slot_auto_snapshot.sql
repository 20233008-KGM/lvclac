-- Per-slot auto snapshot (Phase 2)
-- 자동 스냅샷을 "유저당 최근 세트 1개"에서 "유저가 지정한 클라우드 슬롯 전부"로 확장한다.
-- 스케줄(시각·시간대)은 여전히 account_snapshot_settings에 유저당 1개로 공유하고,
-- "어떤 슬롯을 자동 대상으로 삼을지"만 number_sets 행별 플래그로 관리한다.

-- 1) 슬롯별 자동 스냅샷 대상 여부. 기본 꺼짐(false).
alter table public.number_sets
  add column if not exists auto_snapshot_enabled boolean not null default false;

-- 자동 대상 슬롯만 빠르게 훑기 위한 부분 인덱스.
create index if not exists number_sets_auto_snapshot_idx
  on public.number_sets(user_id)
  where auto_snapshot_enabled = true;

-- 2) 하루 중복 방지 인덱스를 "유저당 1개"에서 "슬롯당 1개"로 교체한다.
-- 기존: (user_id, source_local_date)  → 유저가 하루에 auto 스냅샷 1개까지만 가능(세트 여러 개 불가).
-- 신규: (user_id, number_set_id, source_local_date) → 슬롯마다 하루 1개씩 허용.
drop index if exists public.account_snapshots_auto_user_local_date_idx;

create unique index if not exists account_snapshots_auto_user_slot_local_date_idx
  on public.account_snapshots(user_id, number_set_id, source_local_date)
  where source = 'auto' and source_local_date is not null;
