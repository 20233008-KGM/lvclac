-- Plain-text memos for number sets and immutable account records.
alter table public.number_sets
  add column if not exists memo text;

alter table public.account_snapshots
  add column if not exists memo text;

alter table public.order_history
  add column if not exists memo text;

alter table public.number_sets
  drop constraint if exists number_sets_memo_length_check;
alter table public.number_sets
  add constraint number_sets_memo_length_check
  check (memo is null or char_length(memo) <= 500);

alter table public.account_snapshots
  drop constraint if exists account_snapshots_memo_length_check;
alter table public.account_snapshots
  add constraint account_snapshots_memo_length_check
  check (memo is null or char_length(memo) <= 500);

alter table public.order_history
  drop constraint if exists order_history_memo_length_check;
alter table public.order_history
  add constraint order_history_memo_length_check
  check (memo is null or char_length(memo) <= 500);

drop policy if exists "Account snapshots are updatable by owner" on public.account_snapshots;
create policy "Account snapshots are updatable by owner"
on public.account_snapshots for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Order history is updatable by owner" on public.order_history;
create policy "Order history is updatable by owner"
on public.order_history for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.only_record_memo_may_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (to_jsonb(new) - 'memo') is distinct from (to_jsonb(old) - 'memo') then
    raise exception 'record_body_is_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists account_snapshots_memo_only_update on public.account_snapshots;
create trigger account_snapshots_memo_only_update
before update on public.account_snapshots
for each row execute function public.only_record_memo_may_change();

drop trigger if exists order_history_memo_only_update on public.order_history;
create trigger order_history_memo_only_update
before update on public.order_history
for each row execute function public.only_record_memo_may_change();
