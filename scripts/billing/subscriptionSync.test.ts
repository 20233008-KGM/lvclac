import { describe, it, expect } from 'vitest'
import type { BillingDeps } from './billingConfig'
import {
  customerIdOf,
  getPeriodEndIso,
  mapPaddleStatus,
  type PaddleSubscription,
  syncSubscription,
} from './subscriptionSync'

describe('mapPaddleStatus', () => {
  it('maps allowed statuses through and folds unknown ones to inactive', () => {
    expect(mapPaddleStatus('active')).toBe('active')
    expect(mapPaddleStatus('trialing')).toBe('trialing')
    expect(mapPaddleStatus('past_due')).toBe('past_due')
    expect(mapPaddleStatus('unpaid')).toBe('unpaid')
    expect(mapPaddleStatus('canceled')).toBe('canceled')
    expect(mapPaddleStatus('paused')).toBe('inactive')
    expect(mapPaddleStatus(null)).toBe('inactive')
  })
})

describe('getPeriodEndIso', () => {
  it('reads current_billing_period.ends_at', () => {
    const sub: PaddleSubscription = {
      current_billing_period: { ends_at: '2023-11-14T22:13:20.000Z' },
    }
    expect(getPeriodEndIso(sub)).toBe('2023-11-14T22:13:20.000Z')
  })

  it('falls back to next_billed_at', () => {
    const sub: PaddleSubscription = { next_billed_at: '2027-01-02T03:04:05.000Z' }
    expect(getPeriodEndIso(sub)).toBe('2027-01-02T03:04:05.000Z')
  })

  it('returns null when unavailable', () => {
    expect(getPeriodEndIso({})).toBeNull()
  })
})

describe('customerIdOf', () => {
  it('normalizes Paddle customer references', () => {
    expect(customerIdOf({ customer_id: 'ctm_1' })).toBe('ctm_1')
    expect(customerIdOf({ customer: { id: 'ctm_2' } })).toBe('ctm_2')
    expect(customerIdOf(null)).toBeNull()
  })
})

interface FakeState {
  updates: Record<string, unknown>[]
  inserts: Record<string, unknown>[]
}

function makeDeps(existingRow: { id: string } | null, state: FakeState): BillingDeps {
  const admin = {
    from() {
      return {
        select() {
          return this
        },
        eq() {
          return this
        },
        async maybeSingle() {
          return { data: existingRow, error: null }
        },
        update(patch: Record<string, unknown>) {
          state.updates.push(patch)
          return { eq: async () => ({ error: null }) }
        },
        async insert(row: Record<string, unknown>) {
          state.inserts.push(row)
          return { error: null }
        },
      }
    },
  }
  return { admin, fetch: async () => ({}) } as unknown as BillingDeps
}

describe('syncSubscription', () => {
  const baseSub: PaddleSubscription = {
    id: 'sub_1',
    customer_id: 'ctm_1',
    status: 'active',
    current_billing_period: { ends_at: '2023-11-14T22:13:20.000Z' },
    custom_data: {},
  }

  it('inserts a new row when none exists', async () => {
    const state: FakeState = { updates: [], inserts: [] }
    const deps = makeDeps(null, state)
    const result = await syncSubscription(deps, baseSub, 'user-1')

    expect(result.ok).toBe(true)
    expect(state.inserts).toHaveLength(1)
    expect(state.inserts[0]).toMatchObject({
      user_id: 'user-1',
      provider: 'paddle',
      provider_customer_id: 'ctm_1',
      provider_subscription_id: 'sub_1',
      status: 'active',
    })
  })

  it('updates an existing row', async () => {
    const state: FakeState = { updates: [], inserts: [] }
    const deps = makeDeps({ id: 'row-9' }, state)
    const result = await syncSubscription(deps, baseSub, 'user-1')

    expect(result.ok).toBe(true)
    expect(state.updates).toHaveLength(1)
    expect(state.updates[0]).toMatchObject({
      provider: 'paddle',
      status: 'active',
      provider_subscription_id: 'sub_1',
    })
    expect(state.inserts).toHaveLength(0)
  })

  it('skips when user cannot be resolved', async () => {
    const state: FakeState = { updates: [], inserts: [] }
    const orphan: PaddleSubscription = { ...baseSub, customer_id: null, custom_data: {} }
    const deps = makeDeps(null, state)
    const result = await syncSubscription(deps, orphan, null)

    expect(result).toEqual({ ok: true, skipped: true })
    expect(state.inserts).toHaveLength(0)
    expect(state.updates).toHaveLength(0)
  })
})
