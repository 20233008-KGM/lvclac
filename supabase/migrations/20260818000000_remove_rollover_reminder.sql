-- Remove the retired per-number-set rollover reminder and pending state.
drop index if exists public.number_sets_rollover_due_idx;

alter table public.number_sets
  drop constraint if exists number_sets_rollover_interval_check,
  drop constraint if exists number_sets_rollover_anchor_check,
  drop column if exists rollover_reminder_enabled,
  drop column if exists rollover_interval_months,
  drop column if exists rollover_anchor,
  drop column if exists rollover_next_date,
  drop column if exists rollover_pending;
