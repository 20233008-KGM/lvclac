-- Prevent an older Paddle webhook retry from overwriting newer subscription state.
alter table public.subscriptions
  add column if not exists provider_event_time timestamptz;

comment on column public.subscriptions.provider_event_time is
  'Paddle event occurred_at timestamp used to ignore duplicate or out-of-order subscription webhooks.';
