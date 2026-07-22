import { describe, expect, it } from 'vitest'
import { createNumberSetDeletionRepository } from './numberSets'

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
