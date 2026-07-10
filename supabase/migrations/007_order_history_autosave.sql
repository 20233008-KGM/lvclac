-- 주문 기록(order_history) 자동 저장 여부. 기본값 true로 기존 동작(항상 자동 저장)을 보존한다.
alter table public.profiles
  add column if not exists auto_save_order_history boolean not null default true;
