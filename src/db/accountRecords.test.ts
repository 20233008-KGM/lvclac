import { describe, expect, it } from 'vitest'
import { calculateEvaluate, calculateOrder } from '../calc/leverage'
import { sampleInputs } from '../types'
import {
  buildAccountSnapshotPayload,
  buildOrderHistoryPayload,
  createAccountRecordsRepository,
  rowToAccountSnapshotRecord,
  rowToOrderHistoryRecord,
} from './accountRecords'

describe('account records repository helpers', () => {
  it('builds compact account snapshot payloads without mutating inputs', () => {
    const inputs = { ...sampleInputs }
    const result = calculateEvaluate(inputs)
    const payload = buildAccountSnapshotPayload(inputs, result, 'Morning check')

    expect(payload.title).toBe('Morning check')
    expect(payload.inputs).toEqual(inputs)
    expect(payload.result).toMatchObject({
      liquidationPrice: result.liquidationPrice,
      leverageRatio: result.leverageRatio,
      isAtRisk: result.isAtRisk,
    })
    expect(inputs).toEqual(sampleInputs)
  })

  it('builds order simulation history payloads from before and after states', () => {
    const beforeInputs = { ...sampleInputs, orderContracts: 1, orderPrice: 340 }
    const afterInputs = { ...beforeInputs, contracts: 3, accountEval: 10_000_010 }
    const orderResult = calculateOrder(beforeInputs)
    const payload = buildOrderHistoryPayload(beforeInputs, afterInputs, orderResult)

    expect(payload.positionSide).toBe('long')
    expect(payload.orderContracts).toBe(1)
    expect(payload.orderPrice).toBe(340)
    expect(payload.beforeInputs).toEqual(beforeInputs)
    expect(payload.afterInputs).toEqual(afterInputs)
    expect(payload.beforeResult).toHaveProperty('liquidationPrice')
    expect(payload.afterResult).toHaveProperty('liquidationPrice')
  })

  it('maps rows and tolerates malformed stored JSON', () => {
    const order = rowToOrderHistoryRecord({
      id: 'order-1',
      position_side: 'short',
      order_contracts: '2',
      order_price: '5000',
      before_inputs: 'broken',
      after_inputs: { positionSide: 'short', mode: 'order' },
      before_result: null,
      after_result: { leverageRatio: 2 },
      created_at: '2026-07-05T00:00:00.000Z',
    })

    expect(order.beforeInputs.positionSide).toBe('long')
    expect(order.afterInputs.positionSide).toBe('short')
    expect(order.orderContracts).toBe(2)
    expect(order.orderPrice).toBe(5000)

    const snapshot = rowToAccountSnapshotRecord({
      id: 'snap-1',
      title: '',
      inputs: null,
      result: { isAtRisk: true },
      created_at: '2026-07-05T00:00:00.000Z',
    })

    expect(snapshot.title).toBe('Account snapshot')
    expect(snapshot.inputs.mode).toBe('evaluate')
    expect(snapshot.result.isAtRisk).toBe(true)
  })

  it('returns unavailable errors when Supabase is not configured', async () => {
    const repo = createAccountRecordsRepository(null)

    await expect(repo.fetchRecentRecords('user-1')).resolves.toEqual({
      data: null,
      error: 'supabase_not_configured',
    })
  })

  it('fetches only record counts for account hub summaries', async () => {
    const calls: string[] = []
    const client = {
      from(table: string) {
        calls.push(table)
        return {
          select(_columns: string, options: { count?: string; head?: boolean }) {
            expect(options).toEqual({ count: 'exact', head: true })
            return {
              async eq(column: string, userId: string) {
                expect(column).toBe('user_id')
                expect(userId).toBe('user-1')
                return {
                  count: table === 'order_history' ? 2 : 1,
                  error: null,
                }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)

    await expect(repo.fetchRecordCounts('user-1')).resolves.toEqual({
      data: { orderHistoryCount: 2, accountSnapshotCount: 1 },
      error: null,
    })
    expect(calls).toEqual(['order_history', 'account_snapshots'])
  })
})
