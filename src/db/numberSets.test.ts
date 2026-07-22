import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createNumberSetDeletionRepository } from './numberSets'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

type RpcResult = {
  data: {
    order_history_count: number
    account_snapshot_count: number
    memo_count: number
  } | null
  error: { message: string } | null
}

function deletionClient(result: RpcResult) {
  const seen: Array<{ name: string; params: Record<string, string> }> = []
  return {
    seen,
    rpc(name: string, params: Record<string, string>) {
      seen.push({ name, params })
      return {
        maybeSingle() {
          return Promise.resolve(result)
        },
      }
    },
  }
}

describe('number-set deletion summary', () => {
  it('returns linked order, snapshot, and non-empty memo counts for one owner and slot', async () => {
    const fake = deletionClient({
      data: {
        order_history_count: 4,
        account_snapshot_count: 3,
        memo_count: 4,
      },
      error: null,
    })

    const result = await createNumberSetDeletionRepository(fake as never).fetchSummary(
      'user-1',
      'slot-3',
    )

    expect(result).toEqual({
      data: { orderHistoryCount: 4, accountSnapshotCount: 3, memoCount: 4 },
      error: null,
    })
    expect(fake.seen).toEqual([
      {
        name: 'get_number_set_deletion_summary',
        params: { p_user_id: 'user-1', p_number_set_id: 'slot-3' },
      },
    ])
  })

  it('returns zero counts when the slot has no records or memos', async () => {
    const fake = deletionClient({
      data: { order_history_count: 0, account_snapshot_count: 0, memo_count: 0 },
      error: null,
    })

    await expect(
      createNumberSetDeletionRepository(fake as never).fetchSummary('user-1', 'slot-1'),
    ).resolves.toEqual({
      data: { orderHistoryCount: 0, accountSnapshotCount: 0, memoCount: 0 },
      error: null,
    })
  })

  it('blocks deletion preview when the summary query fails', async () => {
    const fake = deletionClient({ data: null, error: { message: 'count failed' } })

    await expect(
      createNumberSetDeletionRepository(fake as never).fetchSummary('user-1', 'slot-1'),
    ).resolves.toEqual({ data: null, error: 'count failed' })
  })

  it('reports a missing or non-owned set instead of an empty destructive summary', async () => {
    const fake = deletionClient({ data: null, error: null })

    await expect(
      createNumberSetDeletionRepository(fake as never).fetchSummary('other-user', 'slot-3'),
    ).resolves.toEqual({ data: null, error: 'number_set_not_found' })
  })
})

describe('number-set terminology preset storage', () => {
  it('adds a nullable constrained preset column for legacy-compatible cloud slots', () => {
    const migration = source('supabase/migrations/20260723010000_number_set_preset.sql')

    expect(migration).toContain('add column if not exists preset_id text')
    expect(migration).toContain('preset_id is null')
    expect(migration).toContain("'default', 'index', 'stock', 'commodity', 'fx', 'cfd'")
    expect(migration).not.toContain('preset_id text not null')
  })

  it('reads, validates, and writes preset_id through every cloud slot save path', () => {
    const db = source('src/db/numberSets.ts')

    expect(db).toContain("'id,title,inputs,memo,preset_id,updated_at")
    expect(db).toContain('presetId: isPresetId(row.preset_id) ? row.preset_id : null')
    expect(db).toContain('preset_id: presetId')
    expect(db).toContain('export async function setNumberSetPreset')
  })
})
