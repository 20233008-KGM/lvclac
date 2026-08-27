-- Slot-driven automatic account snapshots.
--
-- The former UI exposed both a user-level master switch
-- (account_snapshot_settings.enabled) and per-slot switches
-- (number_sets.auto_snapshot_enabled). The slot switches are now the only
-- user-facing activation control; the user-level flag remains an internal
-- cron scheduling gate.
--
-- Preserve an explicit historical "master off" choice during the transition:
-- do not let previously selected slots unexpectedly resume after the master
-- switch disappears. Slots without a schedule row were also never runnable,
-- so normalize those to off as well.

update public.number_sets as number_set
set auto_snapshot_enabled = false
where number_set.auto_snapshot_enabled = true
  and (
    not exists (
      select 1
      from public.account_snapshot_settings as setting
      where setting.user_id = number_set.user_id
    )
    or exists (
      select 1
      from public.account_snapshot_settings as setting
      where setting.user_id = number_set.user_id
        and setting.enabled = false
    )
  );
