-- Paddle 기간말 해지/일시중지 예약 상태를 UI에 정확히 표시한다.
-- status는 효력 발생일까지 active로 유지되므로 예약 동작과 날짜를 별도 저장해야 한다.
alter table public.subscriptions
  add column if not exists scheduled_change_action text,
  add column if not exists scheduled_change_effective_at timestamptz;

comment on column public.subscriptions.scheduled_change_action is
  'Pending Paddle subscription change action, such as cancel or pause.';

comment on column public.subscriptions.scheduled_change_effective_at is
  'When the pending Paddle subscription change takes effect.';
