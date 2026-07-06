import { describe, it, expect } from 'vitest'
import type Stripe from 'stripe'
import type { BillingDeps } from './billingConfig'
import {
  customerIdOf,
  getPeriodEndIso,
  mapStripeStatus,
  syncSubscription,
} from './subscriptionSync'

describe('mapStripeStatus', () => {
  it('maps allowed statuses through and folds unknown ones to inactive', () => {
    expect(mapStripeStatus('active')).toBe('active')
    expect(mapStripeStatus('trialing')).toBe('trialing')
    expect(mapStripeStatus('past_due')).toBe('past_due')
    expect(mapStripeStatus('unpaid')).toBe('unpaid')
    expect(mapStripeStatus('canceled')).toBe('canceled')
    expect(mapStripeStatus('incomplete')).toBe('inactive')
    expect(mapStripeStatus('paused')).toBe('inactive')
    expect(mapStripeStatus(null)).toBe('inactive')
  })
})

describe('getPeriodEndIso', () => {
  it('reads top-level current_period_end', () => {
    const sub = { current_period_end: 1_700_000_000 } as unknown as Stripe.Subscription
    expect(getPeriodEndIso(sub)).toBe(new Date(1_700_000_000 * 1000).toISOString())
  })

  it('falls back to the first item period end', () => {
    const sub = {
      items: { data: [{ current_period_end: 1_800_000_000 }] },
    } as unknown as Stripe.Subscription
    expect(getPeriodEndIso(sub)).toBe(new Date(1_800_000_000 * 1000).toISOString())
  })

  it('returns null when unavailable', () => {
    expect(getPeriodEndIso({} as Stripe.Subscription)).toBeNull()
  })
})

describe('customerIdOf', () => {
  it('normalizes string and object customers', () => {
    expect(customerIdOf('cus_1')).toBe('cus_1')
    expect(customerIdOf({ id: 'cus_2' })).toBe('cus_2')
    expect(customerIdOf(null)).toBeNull()
  })
})

interface FakeState {
  updates: Record<string, unknown>[]
  inserts: Record<string, unknown>[]
}

/** subscriptions upsert만 흉내내는 최소 admin. hint를 주면 resolveUserId가 여기 닿지 않는다. */
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
  return { admin, stripe: {} } as unknown as BillingDeps
}

describe('syncSubscription', () => {
  const baseSub = {
    id: 'sub_1',
    customer: 'cus_1',
    status: 'active',
    current_period_end: 1_700_000_000,
    metadata: {},
  } as unknown as Stripe.Subscription

  it('inserts a new row when none exists', async () => {
    const state: FakeState = { updates: [], inserts: [] }
    const deps = makeDeps(null, state)
    const result = await syncSubscription(deps, baseSub, 'user-1')

    expect(result.ok).toBe(true)
    expect(state.inserts).toHaveLength(1)
    expect(state.inserts[0]).toMatchObject({
      user_id: 'user-1',
      provider: 'stripe',
      provider_customer_id: 'cus_1',
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
    expect(state.updates[0]).toMatchObject({ status: 'active', provider_subscription_id: 'sub_1' })
    expect(state.inserts).toHaveLength(0)
  })

  it('skips when user cannot be resolved', async () => {
    const state: FakeState = { updates: [], inserts: [] }
    // customer 없음 + hint 없음 → resolveUserId가 null
    const orphan = { ...baseSub, customer: null, metadata: {} } as unknown as Stripe.Subscription
    const deps = makeDeps(null, state)
    const result = await syncSubscription(deps, orphan, null)

    expect(result).toEqual({ ok: true, skipped: true })
    expect(state.inserts).toHaveLength(0)
    expect(state.updates).toHaveLength(0)
  })
})
