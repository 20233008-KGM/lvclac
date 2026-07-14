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

  it('bulk-deletes all order history rows for a user with no per-id filter', async () => {
    const calls: { table: string; column: string; value: string }[] = []
    const client = {
      from(table: string) {
        return {
          delete() {
            return {
              async eq(column: string, value: string) {
                calls.push({ table, column, value })
                return { error: null }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)
    await expect(repo.deleteAllOrderHistory('user-1')).resolves.toEqual({
      data: true,
      error: null,
    })
    expect(calls).toEqual([{ table: 'order_history', column: 'user_id', value: 'user-1' }])
  })

  it('bulk-deletes all account snapshot rows for a user with no per-id filter', async () => {
    const calls: { table: string; column: string; value: string }[] = []
    const client = {
      from(table: string) {
        return {
          delete() {
            return {
              async eq(column: string, value: string) {
                calls.push({ table, column, value })
                return { error: null }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)
    await expect(repo.deleteAllAccountSnapshots('user-1')).resolves.toEqual({
      data: true,
      error: null,
    })
    expect(calls).toEqual([{ table: 'account_snapshots', column: 'user_id', value: 'user-1' }])
  })

  it('returns unavailable errors for bulk delete when Supabase is not configured', async () => {
    const repo = createAccountRecordsRepository(null)

    await expect(repo.deleteAllOrderHistory('user-1')).resolves.toEqual({
      data: null,
      error: 'supabase_not_configured',
    })
    await expect(repo.deleteAllAccountSnapshots('user-1')).resolves.toEqual({
      data: null,
      error: 'supabase_not_configured',
    })
  })

  it('fetchOrderHistoryPage requests limit+1 rows via .range() and reports hasMore=true when exceeded', async () => {
    const calls: { table: string; from: number; to: number }[] = []
    const rows = Array.from({ length: 21 }, (_, i) => ({
      id: `order-${i}`,
      position_side: 'long',
      order_contracts: 1,
      order_price: 100,
      before_inputs: {},
      after_inputs: {},
      before_result: {},
      after_result: {},
      created_at: '2026-07-08T00:00:00.000Z',
    }))
    const client = {
      from(table: string) {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      range(from: number, to: number) {
                        calls.push({ table, from, to })
                        return {
                          returns: () => Promise.resolve({ data: rows, error: null }),
                        }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)
    const result = await repo.fetchOrderHistoryPage('user-1', 0, 20)

    expect(result.error).toBeNull()
    expect(result.data?.records).toHaveLength(20)
    expect(result.data?.hasMore).toBe(true)
    expect(calls).toEqual([{ table: 'order_history', from: 0, to: 20 }])
  })

  it('fetchOrderHistoryPage reports hasMore=false when fewer than limit+1 rows come back', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      id: `order-${i}`,
      position_side: 'long',
      order_contracts: 1,
      order_price: 100,
      before_inputs: {},
      after_inputs: {},
      before_result: {},
      after_result: {},
      created_at: '2026-07-08T00:00:00.000Z',
    }))
    const client = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      range() {
                        return {
                          returns: () => Promise.resolve({ data: rows, error: null }),
                        }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)
    const result = await repo.fetchOrderHistoryPage('user-1', 0, 20)

    expect(result.data?.records).toHaveLength(5)
    expect(result.data?.hasMore).toBe(false)
  })

  it('fetchAccountSnapshotsPage requests limit+1 rows via .range() and caps records at limit', async () => {
    const calls: { table: string; from: number; to: number }[] = []
    const rows = Array.from({ length: 21 }, (_, i) => ({
      id: `snap-${i}`,
      title: 'Account snapshot',
      inputs: {},
      result: {},
      created_at: '2026-07-08T00:00:00.000Z',
    }))
    const client = {
      from(table: string) {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      range(from: number, to: number) {
                        calls.push({ table, from, to })
                        return {
                          returns: () => Promise.resolve({ data: rows, error: null }),
                        }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)
    const result = await repo.fetchAccountSnapshotsPage('user-1', 20, 20)

    expect(result.data?.records).toHaveLength(20)
    expect(result.data?.hasMore).toBe(true)
    expect(calls).toEqual([{ table: 'account_snapshots', from: 20, to: 40 }])
  })

  it('fetchRecentRecords surfaces hasMoreOrders/hasMoreSnapshots independently for a mixed fixture', async () => {
    const orderRows = Array.from({ length: 21 }, (_, i) => ({
      id: `order-${i}`,
      position_side: 'long',
      order_contracts: 1,
      order_price: 100,
      before_inputs: {},
      after_inputs: {},
      before_result: {},
      after_result: {},
      created_at: '2026-07-08T00:00:00.000Z',
    }))
    const snapshotRows = Array.from({ length: 3 }, (_, i) => ({
      id: `snap-${i}`,
      title: 'Account snapshot',
      inputs: {},
      result: {},
      created_at: '2026-07-08T00:00:00.000Z',
    }))
    const client = {
      from(table: string) {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      range() {
                        const rows = table === 'order_history' ? orderRows : snapshotRows
                        return {
                          returns: () => Promise.resolve({ data: rows, error: null }),
                        }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)
    const result = await repo.fetchRecentRecords('user-1')

    expect(result.data?.orderHistory).toHaveLength(20)
    expect(result.data?.accountSnapshots).toHaveLength(3)
    expect(result.data?.hasMoreOrders).toBe(true)
    expect(result.data?.hasMoreSnapshots).toBe(false)
  })

  it('fetchRecentRecords returns available data when only one table fetch fails', async () => {
    const orderRows = [
      {
        id: 'order-1',
        position_side: 'long',
        order_contracts: 1,
        order_price: 100,
        before_inputs: {},
        after_inputs: {},
        before_result: {},
        after_result: {},
        created_at: '2026-07-08T00:00:00.000Z',
      },
    ]
    const client = {
      from(table: string) {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      range() {
                        if (table === 'order_history') {
                          return {
                            returns: () => Promise.resolve({ data: orderRows, error: null }),
                          }
                        }
                        return {
                          returns: () =>
                            Promise.resolve({
                              data: null,
                              error: { message: 'column account_snapshots.source does not exist' },
                            }),
                        }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)
    const result = await repo.fetchRecentRecords('user-1')

    expect(result.error).toBeNull()
    expect(result.data?.orderHistory).toHaveLength(1)
    expect(result.data?.accountSnapshots).toEqual([])
    expect(result.data?.hasMoreOrders).toBe(false)
    expect(result.data?.hasMoreSnapshots).toBe(false)
  })

  it('returns unavailable errors for paginated fetches when Supabase is not configured', async () => {
    const repo = createAccountRecordsRepository(null)

    await expect(repo.fetchOrderHistoryPage('user-1', 0)).resolves.toEqual({
      data: null,
      error: 'supabase_not_configured',
    })
    await expect(repo.fetchAccountSnapshotsPage('user-1', 0)).resolves.toEqual({
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

  it('saves automatic snapshot settings with a computed next run timestamp', async () => {
    const upserts: Array<{ table: string; row: Record<string, unknown> }> = []
    const client = {
      from(table: string) {
        return {
          upsert(row: Record<string, unknown>) {
            upserts.push({ table, row })
            return {
              select() {
                return {
                  async single() {
                    return {
                      data: {
                        enabled: true,
                        label: 'CME close',
                        time_zone: 'Asia/Seoul',
                        time_of_day: '15:45',
                        next_run_at: '2026-07-09T06:45:00.000Z',
                        last_run_at: null,
                        last_run_local_date: null,
                        last_error: null,
                        created_at: '2026-07-09T00:00:00.000Z',
                        updated_at: '2026-07-09T00:00:00.000Z',
                      },
                      error: null,
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)
    const result = await repo.saveAccountSnapshotSettings(
      'user-1',
      {
        enabled: true,
        label: ' CME close ',
        timeZone: 'Asia/Seoul',
        timeOfDay: '15:45',
      },
      new Date('2026-07-09T06:00:00.000Z'),
    )

    expect(result.data).toMatchObject({
      enabled: true,
      label: 'CME close',
      timeZone: 'Asia/Seoul',
      timeOfDay: '15:45',
      nextRunAt: '2026-07-09T06:45:00.000Z',
    })
    expect(upserts).toEqual([
      {
        table: 'account_snapshot_settings',
        row: {
          user_id: 'user-1',
          enabled: true,
          label: 'CME close',
          time_zone: 'Asia/Seoul',
          time_of_day: '15:45',
          next_run_at: '2026-07-09T06:45:00.000Z',
          last_error: null,
        },
      },
    ])
  })

  it('disables automatic snapshot settings without deleting the user rule', async () => {
    const updates: Array<{ table: string; row: Record<string, unknown>; userId: string }> = []
    const client = {
      from(table: string) {
        return {
          update(row: Record<string, unknown>) {
            return {
              eq(_column: string, userId: string) {
                updates.push({ table, row, userId })
                return {
                  select() {
                    return {
                      async single() {
                        return {
                          data: {
                            enabled: false,
                            label: 'CME close',
                            time_zone: 'Asia/Seoul',
                            time_of_day: '15:45',
                            next_run_at: null,
                            last_run_at: null,
                            last_run_local_date: null,
                            last_error: null,
                            created_at: '2026-07-09T00:00:00.000Z',
                            updated_at: '2026-07-09T00:00:00.000Z',
                          },
                          error: null,
                        }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    const repo = createAccountRecordsRepository(client as never)
    const result = await repo.disableAccountSnapshotSettings('user-1')

    expect(result.data?.enabled).toBe(false)
    expect(result.data?.nextRunAt).toBeNull()
    expect(updates).toEqual([
      {
        table: 'account_snapshot_settings',
        row: { enabled: false, next_run_at: null },
        userId: 'user-1',
      },
    ])
  })

  it('fetchAccountSnapshotsPage applies a slot filter via .eq(number_set_id)', async () => {
    const filterCalls: { method: string; column: string; value: unknown }[] = []
    const makeChain = () => {
      const chain = {
        eq(column: string, value: unknown) {
          filterCalls.push({ method: 'eq', column, value })
          return chain
        },
        is(column: string, value: unknown) {
          filterCalls.push({ method: 'is', column, value })
          return chain
        },
        order() {
          return {
            range() {
              return { returns: () => Promise.resolve({ data: [], error: null }) }
            },
          }
        },
      }
      return chain
    }
    const client = { from: () => ({ select: () => makeChain() }) }

    const repo = createAccountRecordsRepository(client as never)
    await repo.fetchAccountSnapshotsPage('user-1', 0, 20, { kind: 'slot', id: 'slot-9' })

    expect(filterCalls).toEqual([
      { method: 'eq', column: 'user_id', value: 'user-1' },
      { method: 'eq', column: 'number_set_id', value: 'slot-9' },
    ])
  })

  it('fetchOrderHistoryPage applies the unassigned filter via .is(number_set_id, null)', async () => {
    const filterCalls: { method: string; column: string; value: unknown }[] = []
    const makeChain = () => {
      const chain = {
        eq(column: string, value: unknown) {
          filterCalls.push({ method: 'eq', column, value })
          return chain
        },
        is(column: string, value: unknown) {
          filterCalls.push({ method: 'is', column, value })
          return chain
        },
        order() {
          return {
            range() {
              return { returns: () => Promise.resolve({ data: [], error: null }) }
            },
          }
        },
      }
      return chain
    }
    const client = { from: () => ({ select: () => makeChain() }) }

    const repo = createAccountRecordsRepository(client as never)
    await repo.fetchOrderHistoryPage('user-1', 0, 20, { kind: 'unassigned' })

    expect(filterCalls).toEqual([
      { method: 'eq', column: 'user_id', value: 'user-1' },
      { method: 'is', column: 'number_set_id', value: null },
    ])
  })

  it('fetchAccountSnapshotsPage with the default (all) filter adds no number_set_id constraint', async () => {
    const filterCalls: { method: string; column: string }[] = []
    const makeChain = () => {
      const chain = {
        eq(column: string) {
          filterCalls.push({ method: 'eq', column })
          return chain
        },
        is(column: string) {
          filterCalls.push({ method: 'is', column })
          return chain
        },
        order() {
          return {
            range() {
              return { returns: () => Promise.resolve({ data: [], error: null }) }
            },
          }
        },
      }
      return chain
    }
    const client = { from: () => ({ select: () => makeChain() }) }

    const repo = createAccountRecordsRepository(client as never)
    await repo.fetchAccountSnapshotsPage('user-1', 0, 20)

    expect(filterCalls).toEqual([{ method: 'eq', column: 'user_id' }])
  })

  it('fetchAccountSnapshotsPage applies the date upper bound via .lte(created_at, before)', async () => {
    const filterCalls: { method: string; column: string; value: unknown }[] = []
    const makeChain = () => {
      const chain = {
        eq(column: string, value: unknown) {
          filterCalls.push({ method: 'eq', column, value })
          return chain
        },
        is(column: string, value: unknown) {
          filterCalls.push({ method: 'is', column, value })
          return chain
        },
        lte(column: string, value: unknown) {
          filterCalls.push({ method: 'lte', column, value })
          return chain
        },
        order() {
          return {
            range() {
              return { returns: () => Promise.resolve({ data: [], error: null }) }
            },
          }
        },
      }
      return chain
    }
    const client = { from: () => ({ select: () => makeChain() }) }

    const repo = createAccountRecordsRepository(client as never)
    await repo.fetchAccountSnapshotsPage(
      'user-1',
      0,
      20,
      { kind: 'slot', id: 'slot-9' },
      '2026-03-02T14:59:59.999Z',
    )

    expect(filterCalls).toEqual([
      { method: 'eq', column: 'user_id', value: 'user-1' },
      { method: 'eq', column: 'number_set_id', value: 'slot-9' },
      { method: 'lte', column: 'created_at', value: '2026-03-02T14:59:59.999Z' },
    ])
  })

  it('fetchRecordCounts applies the date upper bound to both count queries', async () => {
    const lteCalls: { table: string; column: string; value: unknown }[] = []
    const makeQuery = (table: string) => {
      const query = {
        eq() {
          return query
        },
        is() {
          return query
        },
        lte(column: string, value: unknown) {
          lteCalls.push({ table, column, value })
          return query
        },
        then(resolve: (value: { count: number; error: null }) => unknown) {
          return Promise.resolve({ count: 0, error: null }).then(resolve)
        },
      }
      return query
    }
    const client = {
      from: (table: string) => ({ select: () => makeQuery(table) }),
    }

    const repo = createAccountRecordsRepository(client as never)
    await repo.fetchRecordCounts('user-1', { kind: 'all' }, '2026-03-02T14:59:59.999Z')

    expect(lteCalls).toEqual([
      { table: 'order_history', column: 'created_at', value: '2026-03-02T14:59:59.999Z' },
      { table: 'account_snapshots', column: 'created_at', value: '2026-03-02T14:59:59.999Z' },
    ])
  })
})
