-- Per-slot ledger (Phase 1)
-- 기록(스냅샷/주문)을 저장 슬롯(number_sets)에 연결해 "슬롯별 장부"를 가능하게 한다.
-- 컬럼은 nullable, on delete set null: 슬롯을 지워도 기록은 보존되고 '미분류'가 된다.
-- 기존 행은 number_set_id=null → 장부에서 '전체'/'미분류'로 보인다.

alter table public.account_snapshots
  add column if not exists number_set_id uuid references public.number_sets(id) on delete set null;

alter table public.order_history
  add column if not exists number_set_id uuid references public.number_sets(id) on delete set null;

create index if not exists account_snapshots_user_slot_created_idx
  on public.account_snapshots(user_id, number_set_id, created_at desc);

create index if not exists order_history_user_slot_created_idx
  on public.order_history(user_id, number_set_id, created_at desc);
