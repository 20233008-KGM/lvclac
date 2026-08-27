-- A cloud number set owns the account records created from that set.
-- Deleting the set must remove its linked orders/snapshots (and their memos)
-- atomically instead of converting them to unassigned records.

begin;

alter table public.account_snapshots
  drop constraint if exists account_snapshots_number_set_id_fkey;

alter table public.account_snapshots
  add constraint account_snapshots_number_set_id_fkey
  foreign key (number_set_id)
  references public.number_sets(id)
  on delete cascade;

alter table public.order_history
  drop constraint if exists order_history_number_set_id_fkey;

alter table public.order_history
  add constraint order_history_number_set_id_fkey
  foreign key (number_set_id)
  references public.number_sets(id)
  on delete cascade;

create or replace function public.get_number_set_deletion_summary(
  p_user_id uuid,
  p_number_set_id uuid
)
returns table (
  order_history_count bigint,
  account_snapshot_count bigint,
  memo_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (
      select count(*)
      from public.order_history oh
      where oh.user_id = ns.user_id
        and oh.number_set_id = ns.id
    ) as order_history_count,
    (
      select count(*)
      from public.account_snapshots account_snapshot
      where account_snapshot.user_id = ns.user_id
        and account_snapshot.number_set_id = ns.id
    ) as account_snapshot_count,
    (
      case when nullif(btrim(ns.memo), '') is null then 0 else 1 end
      + (
          select count(*)
          from public.order_history oh
          where oh.user_id = ns.user_id
            and oh.number_set_id = ns.id
            and nullif(btrim(oh.memo), '') is not null
        )
      + (
          select count(*)
          from public.account_snapshots account_snapshot
          where account_snapshot.user_id = ns.user_id
            and account_snapshot.number_set_id = ns.id
            and nullif(btrim(account_snapshot.memo), '') is not null
        )
    ) as memo_count
  from public.number_sets ns
  where ns.id = p_number_set_id
    and ns.user_id = p_user_id
    and p_user_id = auth.uid();
$$;

revoke all on function public.get_number_set_deletion_summary(uuid, uuid) from public;
grant execute on function public.get_number_set_deletion_summary(uuid, uuid) to authenticated;

commit;
