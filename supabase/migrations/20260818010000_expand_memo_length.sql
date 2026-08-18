-- Keep cloud number-set and record memo limits aligned with the client editor.
alter table public.number_sets
  drop constraint if exists number_sets_memo_length_check;
alter table public.number_sets
  add constraint number_sets_memo_length_check
  check (memo is null or char_length(memo) <= 20000);

alter table public.account_snapshots
  drop constraint if exists account_snapshots_memo_length_check;
alter table public.account_snapshots
  add constraint account_snapshots_memo_length_check
  check (memo is null or char_length(memo) <= 20000);

alter table public.order_history
  drop constraint if exists order_history_memo_length_check;
alter table public.order_history
  add constraint order_history_memo_length_check
  check (memo is null or char_length(memo) <= 20000);
