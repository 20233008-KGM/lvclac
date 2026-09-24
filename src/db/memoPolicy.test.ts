import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { memoHash } from '../utils/memo'
import { saveMemo } from './memos'
import type { SupabaseClient } from '@supabase/supabase-js'

const actor = '10000000-0000-0000-0000-000000000001'
const other = '10000000-0000-0000-0000-000000000002'
const id = '20000000-0000-0000-0000-000000000001'
let db: PGlite

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as
      $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    grant usage on schema public, auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated;
    create table public.subscriptions(user_id uuid references auth.users(id), status text);
    create table public.number_sets(id uuid primary key, user_id uuid references auth.users(id), title text, memo text);
    create table public.account_snapshots(like public.number_sets including all);
    create table public.order_history(like public.number_sets including all);
    grant all on public.number_sets, public.account_snapshots, public.order_history to authenticated, anon;
    alter table public.number_sets enable row level security;
    alter table public.account_snapshots enable row level security;
    alter table public.order_history enable row level security;
    create policy owned on public.number_sets for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
    create policy owned on public.account_snapshots for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
    create policy owned on public.order_history for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  `)
  await db.exec(readFileSync('supabase/migrations/20260716000000_record_memos.sql', 'utf8'))
  await db.exec(readFileSync('supabase/migrations/20260924000000_plan_memo_policy.sql', 'utf8'))
}, 30_000)

beforeEach(async () => {
  await db.exec(`reset role; truncate auth.users, public.number_sets, public.account_snapshots, public.order_history, public.subscriptions cascade;
    insert into auth.users values ('${actor}'), ('${other}');
    insert into public.number_sets values ('${id}', '${actor}', 'Title', null);
    insert into public.account_snapshots values ('${id}', '${actor}', 'Title', null);
    insert into public.order_history values ('${id}', '${actor}', 'Title', null);
    select set_config('request.jwt.claim.sub', '${actor}', false); set role authenticated;`)
})
afterAll(async () => { await db?.close() })

async function pro() {
  await db.exec(`reset role; insert into public.subscriptions values ('${actor}', 'active'); set role authenticated;`)
}

async function chunk(previous: string, result: string, body = result, options: {
  table?: string; index?: number; final?: boolean; uploadId?: string; offset?: number; deleteCount?: number
} = {}) {
  const { rows } = await db.query<{ result: { error?: string; saved?: boolean; retry_after?: number } }>(
    'select public.save_memo_chunk($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as result',
    [options.table ?? 'number_sets', id, await memoHash(previous), await memoHash(result),
      options.offset ?? 0, options.deleteCount ?? Array.from(previous).length,
      options.uploadId ?? crypto.randomUUID(), options.index ?? 0, options.final ?? true, body],
  )
  return rows[0].result
}

async function saved(table = 'number_sets') {
  return (await db.query<{ memo: string | null }>(`select memo from public.${table} where id = $1`, [id])).rows[0]?.memo
}

describe('memo policy in PostgreSQL', () => {
  it('round-trips the real client patch/chunk protocol through PostgreSQL', async () => {
    await pro()
    const client = { rpc: async (_name: string, args: Record<string, unknown>) => {
      const { rows } = await db.query<{ result: unknown }>(
        'select public.save_memo_chunk($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as result',
        ['p_table', 'p_id', 'p_expected_hash', 'p_result_hash', 'p_offset', 'p_delete_count',
          'p_upload_id', 'p_index', 'p_final', 'p_chunk'].map(key => args[key]),
      )
      return { data: rows[0].result, error: null }
    } } as unknown as SupabaseClient
    const first = '가😀'.repeat(60000)
    expect(await saveMemo(client, 'number_sets', id, '', first)).toBeNull()
    expect(await saved()).toBe(first)
    const next = '앞' + first.slice(0, 90000) + '변경' + first.slice(90000) + '뒤'
    expect(await saveMemo(client, 'number_sets', id, first, next)).toBeNull()
    expect(await saved()).toBe(next)
    expect(await saveMemo(client, 'number_sets', id, next, '')).toBeNull()
    expect(await saved()).toBeNull()
  })
  it.each(['number_sets', 'account_snapshots', 'order_history'])('enforces Free in %s, including emoji, and preserves the saved version on failure', async table => {
    const value = '😀'.repeat(1000)
    expect(await chunk('', value, value, { table })).toEqual({ saved: true })
    expect(await chunk(value, value + 'a', 'a', { table, offset: 1000, deleteCount: 0 })).toEqual({ error: 'memo_free_limit' })
    expect(await saved(table)).toBe(value)
  })

  it('atomically saves more than the old 20k/100k limits in bounded chunks', async () => {
    await pro()
    const value = '가'.repeat(150_000)
    const uploadId = crypto.randomUUID()
    for (let index = 0; index < 3; index++) {
      expect(await chunk('', value, '가'.repeat(50_000), { uploadId, index, final: index === 2 }))
        .toEqual({ saved: index === 2 })
      expect(await saved()).toBe(index === 2 ? value : null)
    }
    expect(await chunk('', value, '가'.repeat(50_000))).toEqual({ saved: true })
  })

  it('preserves long notes after downgrade and permits shortening but not growth', async () => {
    await pro()
    const value = 'A'.repeat(25_000)
    await chunk('', value)
    await db.exec('reset role; delete from public.subscriptions; set role authenticated;')
    expect(await chunk(value, value + 'B', 'B', { offset: 25000, deleteCount: 0 })).toEqual({ error: 'memo_free_limit' })
    expect(await saved()).toBe(value)
    expect(await chunk(value, value.slice(1), '', { deleteCount: 1 })).toEqual({ saved: true })
    expect(await saved()).toHaveLength(24999)
  })

  it('rejects stale tabs, out-of-order chunks and tampered upload metadata', async () => {
    expect(await chunk('', 'first')).toEqual({ saved: true })
    expect(await chunk('', 'stale')).toEqual({ error: 'memo_conflict' })
    const uploadId = crypto.randomUUID()
    expect(await chunk('first', 'second', 'sec', { uploadId, final: false })).toEqual({ saved: false })
    expect(await chunk('first', 'second', 'ond', { uploadId, index: 2 })).toEqual({ error: 'memo_upload_expired' })
    expect(await chunk('first', 'second', 'ond', { uploadId, index: 1, offset: 1 })).toEqual({ error: 'memo_invalid_patch' })
    expect(await saved()).toBe('first')
    expect(await chunk('first', 'second', 'ond', { uploadId, index: 1 })).toEqual({ saved: true })
  })

  it('rejects another owner and invalid table names', async () => {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [other])
    expect(await chunk('', 'intrusion')).toEqual({ error: 'memo_not_found' })
    expect(await chunk('', 'intrusion', 'intrusion', { table: 'subscriptions' })).toEqual({ error: 'memo_request_too_large' })
  })

  it('blocks oversized RPCs and direct update/insert bypasses while preserving other writes', async () => {
    await pro()
    expect(await chunk('', 'A'.repeat(50_001))).toEqual({ error: 'memo_request_too_large' })
    await expect(db.exec(`update public.number_sets set memo = 'bypass' where id = '${id}'`)).rejects.toThrow(/permission denied/)
    await expect(db.exec(`insert into public.number_sets(id,user_id,memo) values(gen_random_uuid(),'${actor}','bypass')`)).rejects.toThrow(/permission denied/)
    await db.exec(`update public.number_sets set title = 'Renamed' where id = '${id}'`)
    await db.exec(`insert into public.number_sets(id,user_id,title) values(gen_random_uuid(),'${actor}','New')`)
  })

  it('enforces per-account request rate across targets and allows later retry', async () => {
    await db.exec(`reset role; insert into public.memo_write_windows values ('${actor}', clock_timestamp(), 120, 0); set role authenticated;`)
    expect(await chunk('', 'blocked')).toMatchObject({ error: 'memo_rate_limited' })
    expect(await saved()).toBeNull()
    await db.exec(`reset role; update public.memo_write_windows set window_start = now() - interval '2 minutes'; set role authenticated;`)
    expect(await chunk('', 'retry')).toEqual({ saved: true })
  })

  it('enforces the byte window, rejects invalid final hashes, and retains saved data', async () => {
    await pro()
    await chunk('', 'safe')
    expect(await chunk('safe', 'target', 'wrong')).toEqual({ error: 'memo_invalid_patch' })
    expect(await saved()).toBe('safe')
    await db.exec(`reset role; update public.memo_write_windows set bytes = 1999999; set role authenticated;`)
    expect(await chunk('safe', '가')).toMatchObject({ error: 'memo_rate_limited' })
    expect(await saved()).toBe('safe')
  })
})
