-- Product policy: Free 1,000 characters; Pro has no product length quota.
-- Each RPC receives <=50,000 Unicode characters / 200,000 UTF-8 bytes.
-- Upload a changed range in parts, then publish atomically with a SHA-256 CAS.
-- Apply together with the new client: old direct memo writes are denied.
begin;

alter table public.number_sets drop constraint if exists number_sets_memo_length_check;
alter table public.account_snapshots drop constraint if exists account_snapshots_memo_length_check;
alter table public.order_history drop constraint if exists order_history_memo_length_check;

create table public.memo_write_windows (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null default 0,
  bytes integer not null default 0
);
create table public.memo_uploads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  upload_id uuid not null,
  target_table text not null,
  target_id uuid not null,
  expected_hash text not null,
  result_hash text not null,
  patch_offset integer not null,
  delete_count integer not null,
  next_index integer not null default 0,
  inserted_chars bigint not null default 0,
  touched_at timestamptz not null default now()
);
create table public.memo_upload_parts (
  user_id uuid not null references public.memo_uploads(user_id) on delete cascade,
  part_index integer not null,
  body text not null check (char_length(body) <= 50000 and octet_length(body) <= 200000),
  primary key (user_id, part_index)
);
alter table public.memo_write_windows enable row level security;
alter table public.memo_uploads enable row level security;
alter table public.memo_upload_parts enable row level security;
revoke all on public.memo_write_windows, public.memo_uploads, public.memo_upload_parts from public, anon, authenticated;

-- Prevent bypassing the RPC through table writes, including INSERT / UPSERT.
-- Keep every other existing column writable under its existing RLS policies.
do $$
declare
  target_name text;
  columns_sql text;
begin
  foreach target_name in array array['number_sets', 'account_snapshots', 'order_history'] loop
    execute format('revoke insert, update on public.%I from public, anon, authenticated', target_name);
    execute format('revoke insert (memo), update (memo) on public.%I from public, anon, authenticated', target_name);
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into columns_sql
      from information_schema.columns where table_schema = 'public'
        and information_schema.columns.table_name = target_name and column_name <> 'memo';
    execute format('grant insert (%s), update (%s) on public.%I to authenticated', columns_sql, columns_sql, target_name);
  end loop;
end $$;

create or replace function public.save_memo_chunk(
  p_table text, p_id uuid, p_expected_hash text, p_result_hash text,
  p_offset integer, p_delete_count integer, p_upload_id uuid,
  p_index integer, p_final boolean, p_chunk text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_memo text;
  current_hash text;
  next_memo text;
  inserted_text text;
  pro boolean;
  write_window public.memo_write_windows%rowtype;
  upload public.memo_uploads%rowtype;
begin
  if actor is null then return jsonb_build_object('error', 'not_logged_in'); end if;
  if p_table is null or p_table not in ('number_sets', 'account_snapshots', 'order_history')
    or p_id is null or p_upload_id is null or p_final is null
    or p_offset is null or p_offset < 0 or p_delete_count is null or p_delete_count < 0
    or p_index is null or p_index < 0
    or p_expected_hash is null or p_expected_hash !~ '^[0-9a-f]{64}$'
    or p_result_hash is null or p_result_hash !~ '^[0-9a-f]{64}$'
    or p_chunk is null or octet_length(p_chunk) > 200000 or char_length(p_chunk) > 50000 then
    return jsonb_build_object('error', 'memo_request_too_large');
  end if;

  -- Serialize each account before locking a target, including concurrent tabs.
  insert into public.memo_write_windows(user_id, window_start) values(actor, clock_timestamp())
    on conflict (user_id) do nothing;
  select * into write_window from public.memo_write_windows where user_id = actor for update;
  if write_window.window_start + interval '1 minute' <= clock_timestamp() then
    update public.memo_write_windows set window_start = clock_timestamp(), requests = 0, bytes = 0
      where user_id = actor returning * into write_window;
  end if;
  if write_window.requests >= 120 or write_window.bytes + octet_length(p_chunk) > 2000000 then
    return jsonb_build_object('error', 'memo_rate_limited', 'retry_after',
      greatest(1, ceil(extract(epoch from write_window.window_start + interval '1 minute' - clock_timestamp()))));
  end if;
  update public.memo_write_windows set requests = requests + 1, bytes = bytes + octet_length(p_chunk)
    where user_id = actor;

  execute format('select coalesce(memo, '''') from public.%I where id = $1 and user_id = $2 for update', p_table)
    into current_memo using p_id, actor;
  if current_memo is null then return jsonb_build_object('error', 'memo_not_found'); end if;
  current_hash := encode(sha256(convert_to(current_memo, 'UTF8')), 'hex');
  -- A lost final response can safely be retried without applying the patch twice.
  if current_hash = p_result_hash then return jsonb_build_object('saved', true); end if;
  if current_hash <> p_expected_hash then return jsonb_build_object('error', 'memo_conflict'); end if;
  if p_offset > char_length(current_memo) or p_delete_count > char_length(current_memo) - p_offset then
    return jsonb_build_object('error', 'memo_invalid_patch');
  end if;

  if p_index = 0 then
    delete from public.memo_uploads where user_id = actor;
    insert into public.memo_uploads(user_id, upload_id, target_table, target_id,
      expected_hash, result_hash, patch_offset, delete_count)
      values(actor, p_upload_id, p_table, p_id, p_expected_hash, p_result_hash, p_offset, p_delete_count);
  end if;
  select * into upload from public.memo_uploads where user_id = actor;
  if upload.user_id is null or upload.upload_id <> p_upload_id or upload.next_index <> p_index
    or upload.target_table <> p_table or upload.target_id <> p_id
    or upload.expected_hash <> p_expected_hash or upload.result_hash <> p_result_hash
    or upload.patch_offset <> p_offset or upload.delete_count <> p_delete_count
    or upload.touched_at < clock_timestamp() - interval '1 hour' then
    return jsonb_build_object('error', 'memo_upload_expired');
  end if;
  select exists(select 1 from public.subscriptions where user_id = actor and status in ('active', 'trialing')) into pro;
  if not pro and char_length(current_memo)::bigint - p_delete_count + upload.inserted_chars + char_length(p_chunk)
    > greatest(1000, char_length(current_memo)) then
    delete from public.memo_uploads where user_id = actor;
    return jsonb_build_object('error', 'memo_free_limit');
  end if;
  insert into public.memo_upload_parts(user_id, part_index, body) values(actor, p_index, p_chunk);
  update public.memo_uploads set next_index = next_index + 1, inserted_chars = inserted_chars + char_length(p_chunk), touched_at = clock_timestamp() where user_id = actor;
  if not p_final then return jsonb_build_object('saved', false); end if;

  select string_agg(body, '' order by part_index) into inserted_text
    from public.memo_upload_parts where user_id = actor;
  next_memo := left(current_memo, p_offset) || inserted_text || substr(current_memo, p_offset + p_delete_count + 1);
  if encode(sha256(convert_to(next_memo, 'UTF8')), 'hex') <> p_result_hash then
    delete from public.memo_uploads where user_id = actor;
    return jsonb_build_object('error', 'memo_invalid_patch');
  end if;
  select exists(select 1 from public.subscriptions where user_id = actor and status in ('active', 'trialing')) into pro;
  -- Grandfather existing long notes, including cancellation/downgrade; never truncate.
  if not pro and char_length(next_memo) > greatest(1000, char_length(current_memo)) then
    delete from public.memo_uploads where user_id = actor;
    return jsonb_build_object('error', 'memo_free_limit');
  end if;
  execute format('update public.%I set memo = nullif($1, '''') where id = $2 and user_id = $3', p_table)
    using next_memo, p_id, actor;
  delete from public.memo_uploads where user_id = actor;
  return jsonb_build_object('saved', true);
end;
$$;
revoke all on function public.save_memo_chunk(text, uuid, text, text, integer, integer, uuid, integer, boolean, text) from public, anon;
grant execute on function public.save_memo_chunk(text, uuid, text, text, integer, integer, uuid, integer, boolean, text) to authenticated;

-- Production already uses pg_cron. Minimal local databases can omit it.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('expired-memo-uploads', '17 * * * *',
      $job$delete from public.memo_uploads where touched_at < now() - interval '1 hour';$job$);
  end if;
end $$;
commit;
